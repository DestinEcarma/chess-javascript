import Board from "./board.js"
import Move from "./move.js"
import {
	level_moves,
	diagonal_moves,
	knight_moves,
	pawn_moves,
	pawn_attacks,
	king_moves,
} from "./pre-calculated-moves.js"
import { piece as Piece, piece_type_bytes } from "./piece.js"

export default class chess_engine {
	constructor(fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") {
		this.board = new Board(fen)

		this.moves = []
		this.double_check = false
		this.pins_exist = false
		this.in_check = false
		this.opponent_attack_mask = 0
		this.check_ray_mask = 0
		this.pin_ray_mask = 0
	}

	generate_sliding_attack_mask() {
		
	}

	calculate_brq_attack(pre_moves_list, type) {
		const board = this.board

		for (let pre_moves of pre_moves_list) {
			let possible_pin = false
			let ray_mask = 0

			for (let target_square of pre_moves) {
				const color_on_target_square = board.color[target_square]

				ray_mask |= 1 << target_square

				if (color_on_target_square !== Piece.EMPTY) {
					if (color_on_target_square === board.turn) {
						if (!possible_pin) {
							possible_pin = true
						} else break
					} else {
						const piece_on_target_square = board.piece[target_square]

						if (board[type](piece_on_target_square)) {
							if (possible_pin) {
								this.pin_ray_mask |= ray_mask
								this.pins_exist = true
							} else {
								this.check_ray_mask |= ray_mask
								this.double_check = this.in_check
								this.in_check = true
							}

							break
						} else break
					}
				}
			}

			if (this.double_check) break
		}
	}

	calculate_attack_data() {
		const board = this.board
		const start_square = board.king_square[board.turn]

		this.calculate_brq_attack(level_moves[start_square], "is_rook_queen")
		if (!this.double_check) this.calculate_brq_attack(diagonal_moves[start_square], "is_bishop_queen")

		for (let target_square of knight_moves[start_square]) {
			if (board.color[target_square] === board.x_turn && board.piece[target_square] === Piece.KNIGHT) {
				this.double_check = this.in_check
				this.in_check = true
				this.check_ray_mask |= 1 << target_square

				break
			}
		}

		for (let target_square of pawn_attacks[board.turn][start_square]) {
			if (board.color[target_square] === board.x_turn && board.piece[target_square] === Piece.PAWN) {
				this.double_check = this.in_check
				this.in_check = true
				this.check_ray_mask |= 1 << target_square

				break
			}
		}
	}

	generate_moves() {
		const board = this.board

		this.calculate_attack_data()

		for (let start_square of board.positions[board.turn]) {
			const piece = board.piece[start_square]

			if (board.is_sliding_piece(piece)) {
				if (board.is_rook_queen(piece)) this.generate_sliding_moves(start_square, level_moves[start_square])
				if (board.is_bishop_queen(piece))
					this.generate_sliding_moves(start_square, diagonal_moves[start_square])
			} else if (board.is_type(piece, Piece.KNIGHT)) {
				this.generate_knight_moves(start_square)
			} else if (board.is_type(piece, Piece.PAWN)) {
				this.generate_pawn_moves(start_square)
			} else if (board.is_type(piece, Piece.KING)) {
				this.generate_king_moves(start_square)
			}
		}

		return this.moves
	}

	generate_sliding_moves(start_square, pre_moves_list) {
		const board = this.board

		const is_pinned = this.is_pinned(start_square)
		if (this.in_check && is_pinned) return
		for (let pre_moves of pre_moves_list) {
			for (let target_square of pre_moves) {
				const piece_on_target_square = board.color[target_square]

				if (is_pinned && !this.is_pinned(target_square)) continue
				if (piece_on_target_square === board.turn) break

				const move_prevents_check = this.square_is_in_check_ray(target_square)

				if (move_prevents_check || !this.in_check) this.moves.push(`${start_square}, ${target_square}`)
				if (piece_on_target_square !== Piece.EMPTY) break
			}
		}
	}

	generate_knight_moves(start_square) {
		const board = this.board

		if (this.is_pinned(start_square)) return

		for (let target_square of knight_moves[start_square]) {
			if (
				board.color[target_square] === board.turn ||
				(this.in_check && !this.square_is_in_check_ray(target_square))
			)
				continue
			this.moves.push(`${start_square}, ${target_square}`)
		}
	}

	generate_king_moves(start_square) {
		const board = this.board

		for (let target_square of king_moves[start_square]) {
			const piece_on_target_square = board.color[target_square]

			if (piece_on_target_square === board.turn) continue

			const is_capture = piece_on_target_square === board.x_turn
			if (!is_capture) this.moves.push(`${start_square}, ${target_square}`)


		}
	}

	generate_pawn_moves(start_square) {
		const board = this.board
		const turn = board.turn
		const square = board.piece

		{
			const target_square = pawn_moves[turn][start_square]

			if (square[target_square] === Piece.EMPTY) {
				if (turn === Piece.WHITE) {
					const dpp_pawn_push = target_square + 8

					this.generate_pawn_push_move(
						start_square,
						target_square,
						start_square <= 15 && square[dpp_pawn_push] === Piece.EMPTY,
						dpp_pawn_push,
						start_square >= 48
					)
				} else {
					const dpp_pawn_push = target_square - 8

					this.generate_pawn_push_move(
						start_square,
						target_square,
						start_square >= 48 && square[dpp_pawn_push] === Piece.EMPTY,
						dpp_pawn_push,
						start_square <= 15
					)
				}
			}
		}

		for (let target_square of pawn_attacks[turn][start_square]) {
			if (board.color[target_square] === board.x_turn) {
				if (turn === Piece.WHITE && target_square >= 48) {
					this.generate_pawn_promotion_moves(start_square, target_square)
				} else if (turn === Piece.BLACK && target_square <= 15) {
					this.generate_pawn_promotion_moves(start_square, target_square)
				} else this.moves.push(`${start_square}, ${target_square}`)
			}
		}
	}

	generate_pawn_push_move(start_square, target_square, double_pawn_push, dpp_target_square, promotion) {
		if (promotion) {
			this.generate_pawn_promotion_moves(start_square, target_square)
		} else {
			this.moves.push(`${start_square}, ${target_square}`)
			if (double_pawn_push) this.moves.push(`${start_square}, ${dpp_target_square}`)
		}
	}

	generate_pawn_promotion_moves(start_square, target_square) {
		this.moves.push(`${start_square}, ${target_square}`)
		this.moves.push(`${start_square}, ${target_square}`)
		this.moves.push(`${start_square}, ${target_square}`)
		this.moves.push(`${start_square}, ${target_square}`)
	}

	is_pinned(square) {
		return this.pins_exist && ((this.pin_ray_mask >> square) & 1) != 0
	}

	square_is_in_check_ray(square) {
		return this.in_check && ((this.check_ray_mask >> square) & 1) != 0
	}
}
