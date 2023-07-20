import { BitboardClass } from "./bitboard.js"
import { BoardClass } from "./board.js"
import {
	diagonal_attacks,
	diagonal_masks,
	horizontal_enpasant_attacks,
	horizontal_enpasant_masks,
	king_masks,
	knight_masks,
	level_attacks,
	level_masks,
	pawn_capture_masks,
	pawn_double_push_mask,
} from "./pre-moves.js"
import {
	DIAGONAL_MAGIC_NUMBERS,
	LEVEL_MAGIC_NUMBERS,
	DIAGONAL_BITS,
	LEVEL_BITS,
	COLOR,
	PIECES,
	HORIZONTAL_ENPASSANT_MAGIC_NUMBERS,
	HORIZONTAL_ENPASSANT_BITS,
	MOVE_INFO,
	INDEX_FROM_NOTATION,
	CASTLE_RIGHTS,
	CASTLE_EMPTY_OCCUPANCIES,
	CASTLE_SQUARE_INDEX,
	PAWN_SHIFT_DIRECTION,
	PAWN_MOVE_DIRECTION,
	PAWN_PROMOTION_MASK,
	PROMOTION_PIECES,
	CASTLE_RIGHTS_ROOK_SQUARE_INDEX,
	CASTLE_ROOK_MOVED,
	CASTLE_ATTACKED_MASK,
	CASLTE_ROOK_POSITIONS,
	CASTLE_KING_MOVED,
} from "./constant-var.js"
import { Move } from "./Move.js"

export class ChessEngineClass {
	board = new BoardClass()
	move_history = []

	turn = COLOR.WHITE
	x_turn = COLOR.BLACK

	enpassant = -1
	caslte_rights = 0

	opponent_attack_mask = new BitboardClass()
	check_ray_mask = new BitboardClass()
	pin_rays = []

	double_check = false
	in_check = false

	active_king_square_index = -1

	make_move_info_funcs = {
		[MOVE_INFO.DOUBLE_PAWN_PUSH]: (turn, _, move) => {
			this.enpassant = move.target_square - PAWN_MOVE_DIRECTION[turn]
		},
		[MOVE_INFO.ENPASSANT]: (_, x_turn, move) => {
			this.board.CapturePiece(PIECES.PAWN, x_turn, move.target_square + PAWN_MOVE_DIRECTION[x_turn])
			move.captured = PIECES.PAWN
		},
		[MOVE_INFO.CASTLE]: (turn, _, move) => {
			const indices = CASTLE_RIGHTS_ROOK_SQUARE_INDEX[move.type]
			this.board.MakeMove(PIECES.ROOK, turn, indices[0], indices[1])
		},
		[MOVE_INFO.PROMOTION]: (turn, _, move) => {
			this.board.PromotePawn(move.type, turn, move.target_square)
		},
	}

	undo_move_info_funcs = {
		[MOVE_INFO.DOUBLE_PAWN_PUSH]: () => {},
		[MOVE_INFO.ENPASSANT]: (_, x_turn, move) => {
			this.board.UndoCapturedPiece(PIECES.PAWN, x_turn, move.target_square + PAWN_MOVE_DIRECTION[x_turn])
		},
		[MOVE_INFO.CASTLE]: (turn, _, move) => {
			const indices = CASTLE_RIGHTS_ROOK_SQUARE_INDEX[move.type]
			this.board.UndoMove(PIECES.ROOK, turn, indices[0], indices[1])
		},
		[MOVE_INFO.PROMOTION]: (turn, _, move) => {
			this.board.UndoPromotion(move.type, turn, move.target_square)
		},
	}

	LoadPosition(fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") {
		const fen_split = fen.split(" ")

		//* Piece placement
		this.board.LoadPiecePlacement(fen_split[0])

		//* Active color & Inactive color
		if (fen_split[1] === "w") {
			this.turn = COLOR.WHITE
			this.x_turn = COLOR.BLACK
		} else {
			this.turn = COLOR.BLACK
			this.x_turn = COLOR.WHITE
		}

		//* Castling rights
		if (fen_split[2] !== "-") {
			fen_split[2].split("").forEach((char) => {
				this.caslte_rights |= CASTLE_RIGHTS[char]
			})
		} else this.caslte_rights = 0

		//* Possible En Passant targets
		if (fen_split[3] !== "-") {
			this.enpassant = INDEX_FROM_NOTATION[fen_split[3].toLowerCase()]
		} else this.enpassant = -1

		//TODO: Half move clock

		//TODO: Full move number
	}

	PrintBoard() {
		const board = this.board

		let board_string = "     a   b   c   d   e   f   g   h\n"
		board_string += "   +———+———+———+———+———+———+———+———+\n"

		for (let rank = 7; rank >= 0; rank--) {
			for (let file = 0; file < 8; file++) {
				if (file === 0) board_string += ` ${rank + 1} `

				board_string += `| ${board.GetPieceTypeFromSquareIndex(rank * 8 + file) || " "} `
				if (file === 7) board_string += `| ${rank + 1}`
			}

			board_string += "\n   +———+———+———+———+———+———+———+———+\n"
		}

		board_string += "     a   b   c   d   e   f   g   h\n"
		console.log(board_string)
	}

	PrintTurnPosition(turn) {
		const board = this.board

		let board_string = "     a   b   c   d   e   f   g   h\n"
		board_string += "   +———+———+———+———+———+———+———+———+\n"

		for (let rank = 7; rank >= 0; rank--) {
			for (let file = 0; file < 8; file++) {
				if (file === 0) board_string += ` ${rank + 1} `

				const square_index = rank * 8 + file
				const is_turn = board.color[turn].isOccupied(square_index)
				const piece = is_turn ? board.GetPieceTypeFromSquareIndex(square_index) : false

				board_string += `| ${piece || " "} `
				if (file === 7) board_string += `| ${rank + 1}`
			}

			board_string += "\n   +———+———+———+———+———+———+———+———+\n"
		}

		board_string += "     a   b   c   d   e   f   g   h\n"
		console.log(board_string)
	}

	ResetMoveGeneration() {
		this.active_king_square_index = this.board.GetKingSquareIndex(this.turn)

		this.opponent_attack_mask.Zero()
		this.check_ray_mask.Zero()
		this.pin_rays = []

		this.double_check = false
		this.in_check = false
	}

	GetPawnPushMask() {
		const board = this.board
		const turn = this.turn
		const occupancies = ~board.occupancies.Raw()
		const shift_direction = PAWN_SHIFT_DIRECTION[turn]

		const single_push = new BitboardClass(board[PIECES.PAWN][turn].Raw())
		single_push[shift_direction](8n)
		single_push.And(occupancies)

		const double_push = new BitboardClass(single_push.Raw() & pawn_double_push_mask[turn])
		double_push[shift_direction](8n).And(occupancies)

		return { single_push, double_push }
	}

	GetPawnCaptureMask(square_index, turn = this.turn, x_turn = this.x_turn) {
		const pawn_attack_mask = new BitboardClass(pawn_capture_masks[turn][square_index])
		const occupancies = this.board.color[x_turn].Raw()

		return pawn_attack_mask.And(occupancies)
	}

	GetPawnEnpassantMask() {
		const enpassant = new BitboardClass(pawn_capture_masks[this.x_turn][this.enpassant])
		enpassant.And(this.board[PIECES.PAWN][this.turn].Raw())

		return enpassant
	}

	GetKnightJumpMask(square_index, turn) {
		return new BitboardClass(knight_masks[square_index] & ~this.board.color[turn ?? this.turn].Raw())
	}

	GetSlidingAttackMask(square_index, masks, magic_number, bits, attacks, occupancies) {
		occupancies &= masks[square_index]
		// occupancies *= magic_number[square_index]
		// occupancies >>= BigInt(64 - bits[square_index])

		return new BitboardClass(attacks[square_index][occupancies])
	}

	GetSlidingXRayMask(square_index, occupancies, blockers, func) {
		const attack_mask = func.bind(this)(square_index, occupancies)
		const raw = attack_mask.Raw()
		blockers &= raw

		if (blockers === 0n) return { x_ray: new BitboardClass(), attack_mask }
		return {
			x_ray: new BitboardClass(
				raw ^
					func
						.bind(this)(square_index, occupancies ^ blockers)
						.Raw()
			),
			attack_mask,
		}
	}

	GetRookAttackMask(square_index, occupancies = this.board.occupancies.Raw()) {
		return this.GetSlidingAttackMask(
			square_index,
			level_masks,
			LEVEL_MAGIC_NUMBERS,
			LEVEL_BITS,
			level_attacks,
			occupancies
		)
	}

	GetRookXRayAttackMask(square_index, occupancies, blockers) {
		const board = this.board

		return this.GetSlidingXRayMask(
			square_index,
			occupancies ?? board.occupancies.Raw(),
			blockers ?? board.color[this.turn].Raw(),
			this.GetRookAttackMask
		)
	}

	GetBishopAttackMask(square_index, occupancies = this.board.occupancies.Raw()) {
		return this.GetSlidingAttackMask(
			square_index,
			diagonal_masks,
			DIAGONAL_MAGIC_NUMBERS,
			DIAGONAL_BITS,
			diagonal_attacks,
			occupancies
		)
	}

	GetBishopXRayAttackMask(square_index, occupancies, blockers) {
		const board = this.board

		return this.GetSlidingXRayMask(
			square_index,
			occupancies ?? board.occupancies.Raw(),
			blockers ?? board.color[this.turn].Raw(),
			this.GetBishopAttackMask
		)
	}

	GetHorizontalEnpassantMask(square_index, occupancies = this.board.occupancies.Raw()) {
		return this.GetSlidingAttackMask(
			square_index,
			horizontal_enpasant_masks,
			HORIZONTAL_ENPASSANT_MAGIC_NUMBERS,
			HORIZONTAL_ENPASSANT_BITS,
			horizontal_enpasant_attacks,
			occupancies
		)
	}

	GetKingMask(square_index) {
		return new BitboardClass(king_masks[square_index] & ~this.board.color[this.turn])
	}

	GenerateCheckAndPinRays(attacking_pieces, rook = true) {
		const king_square_index = this.active_king_square_index

		//* Stop's the function if it's a double check, only the king can move from this point
		if (this.double_check) return

		const get_attack_mask = rook ? "GetRookAttackMask" : "GetBishopAttackMask"
		const get_x_ray_attack_mask = rook ? "GetRookXRayAttackMask" : "GetBishopXRayAttackMask"

		const attack = this[get_attack_mask](king_square_index).Raw()
		const attackers = new BitboardClass(attack & attacking_pieces)

		//* Check's if king is in check
		if (attackers.Raw()) {
			attackers.GetBitIndices().forEach((square_index) => {
				this.double_check = this.in_check
				this.in_check = true

				if (this.double_check) return
				this.check_ray_mask.Set(square_index)
				this.check_ray_mask.Or(this[get_attack_mask](square_index).Raw() & attack)
			})
		}

		//* Check's if a piece is pinned
		else {
			const { x_ray, attack_mask } = this[get_x_ray_attack_mask](king_square_index)
			const attack_mask_raw = attack_mask.Raw()
			const x_ray_raw = x_ray.Raw()

			const pinner = new BitboardClass(x_ray_raw & attacking_pieces)
			if (!pinner.Raw()) return

			pinner.GetBitIndices().forEach((square_index) => {
				const { x_ray: pinner_ray, attack_mask: pinner_am } = this[get_x_ray_attack_mask](square_index)
				const pinner_am_raw = pinner_am.Raw()

				const pinned_piece = attack_mask_raw & pinner_am_raw
				const ray = new BitboardClass((x_ray_raw & pinner_am_raw) | (attack_mask_raw & pinner_ray.Raw())).Set(
					square_index
				)

				this.pin_rays[pinner_ray.GetLSBIndex(pinned_piece)] = ray.Raw()
			})
		}
	}

	CalculateAttackMask() {
		const board = this.board
		const turn = this.turn
		const x_turn = this.x_turn

		const king_bitbaord = board[PIECES.KING][turn].Raw()

		const queens = board[PIECES.QUEEN][x_turn]
		const queens_bitboard = queens.Raw()

		if (!king_bitbaord) {
			console.log(king_bitbaord)

			this.PrintBoard()

			throw new Error()
		}

		//* Opponent king moves
		this.opponent_attack_mask.Or(king_masks[board.GetKingSquareIndex(x_turn)])

		//* Level check and pin rays
		this.GenerateCheckAndPinRays(board[PIECES.ROOK][x_turn].Raw() | queens_bitboard, true)

		//* Diagonal check and pin rays
		this.GenerateCheckAndPinRays(board[PIECES.BISHOP][x_turn].Raw() | queens_bitboard, false)

		//* Knight jumps
		{
			let is_knight_check = false

			board.GetKnightSquareIndices(x_turn).forEach((square_index) => {
				const jump_mask = knight_masks[square_index]
				this.opponent_attack_mask.Or(jump_mask)

				if (!is_knight_check && jump_mask & king_bitbaord) {
					is_knight_check = true

					this.double_check = this.in_check
					this.in_check = true
					this.check_ray_mask.Set(square_index)
				}
			})
		}

		//* Pawn captures
		{
			let is_pawn_check = false

			board.GetPawnSquareIndices(x_turn).forEach((square_index) => {
				const capture_mask = pawn_capture_masks[x_turn][square_index]
				this.opponent_attack_mask.Or(capture_mask)

				if (!is_pawn_check && capture_mask & king_bitbaord) {
					is_pawn_check = true

					this.double_check = this.in_check
					this.in_check = true
					this.check_ray_mask.Set(square_index)
				}
			})
		}

		//* Opponent sliding peices attacks
		{
			const no_king_occ = board.occupancies.Raw() & ~king_bitbaord
			const queen_indices = queens.GetBitIndices()

			//* Rook or queen
			;[...board.GetRookSquareIndices(x_turn), ...queen_indices].forEach((square_index) => {
				const attack_mask = this.GetRookAttackMask(square_index, no_king_occ).Raw()

				this.opponent_attack_mask.Or(attack_mask)
			})

			//* Bishop or queen
			;[...board.GetBishopSquareIndices(x_turn), ...queen_indices].forEach((square_index) => {
				const attack_mask = this.GetBishopAttackMask(square_index, no_king_occ).Raw()

				this.opponent_attack_mask.Or(attack_mask)
			})
		}
	}

	//* Does not work for pawn push
	IsolateMaskFromCheckOrPinRay(square_index, mask) {
		if (this.in_check) mask.And(this.check_ray_mask.Raw())

		const ray = this.pin_rays[square_index]
		if (ray) mask.And(ray)
	}

	isPawnPushOnRay(square_index, target_square) {
		if (this.in_check && this.check_ray_mask.isOccupied(target_square)) return true

		const ray = this.pin_rays[square_index]
		if (!ray) return true
		if (ray & (1n << BigInt(target_square))) return true

		return false
	}

	GenerateKingMoves(moves = []) {
		const board = this.board
		const turn = this.turn

		const square_index = this.active_king_square_index
		const opponent_attack_mask = ~this.opponent_attack_mask.Raw()

		const king_mask = new BitboardClass(king_masks[square_index])
		king_mask.And(~board.color[turn].Raw())
		king_mask.And(opponent_attack_mask)

		king_mask.GetBitIndices().forEach((target_square) => {
			moves.push(new Move(square_index, target_square, PIECES.KING))
		})

		//* Castling moves
		if (this.in_check) return
		const occupancies = ~board.occupancies.Raw()
		const rook = board[PIECES.ROOK][turn].Raw()

		CASTLE_EMPTY_OCCUPANCIES[turn].forEach(([castle_right, castle_empty_occupancies]) => {
			const castle_attacked_mask = CASTLE_ATTACKED_MASK[castle_right]

			if (!(this.caslte_rights & castle_right)) return
			if (!(rook & CASLTE_ROOK_POSITIONS[castle_right])) return
			if ((castle_empty_occupancies & occupancies) !== castle_empty_occupancies) return
			if ((castle_attacked_mask & opponent_attack_mask) !== castle_attacked_mask) return

			moves.push(
				new Move(square_index, CASTLE_SQUARE_INDEX[castle_right], PIECES.KING, MOVE_INFO.CASTLE, castle_right)
			)
		})
	}

	GeneratePawnMoves(moves) {
		const board = this.board
		const turn = this.turn
		const x_turn = this.x_turn
		const promotion_mask = PAWN_PROMOTION_MASK[turn]

		const check_ray_mask = this.check_ray_mask
		const { single_push, double_push } = this.GetPawnPushMask()

		if (this.in_check) {
			const raw = check_ray_mask.Raw()

			single_push.And(raw)
			double_push.And(raw)
		}

		const push_promotion = promotion_mask & single_push.Raw()
		const opposite_move_direction = PAWN_MOVE_DIRECTION[x_turn]

		new BitboardClass(push_promotion).GetBitIndices().forEach((target_index) => {
			const square_index = target_index + opposite_move_direction
			if (!this.isPawnPushOnRay(square_index, target_index)) return

			PROMOTION_PIECES.forEach((promotion_piece) => {
				moves.push(new Move(square_index, target_index, PIECES.PAWN, MOVE_INFO.PROMOTION, promotion_piece))
			})
		})

		single_push.And(~push_promotion)
		single_push.GetBitIndices().forEach((target_index) => {
			const square_index = target_index + opposite_move_direction
			if (!this.isPawnPushOnRay(square_index, target_index)) return

			moves.push(new Move(square_index, target_index, PIECES.PAWN))
		})

		double_push.GetBitIndices().forEach((target_index) => {
			const square_index = target_index + opposite_move_direction * 2
			if (!this.isPawnPushOnRay(square_index, target_index)) return

			moves.push(new Move(square_index, target_index, PIECES.PAWN, MOVE_INFO.DOUBLE_PAWN_PUSH))
		})

		board.GetPawnSquareIndices(turn).forEach((square_index) => {
			const capture_mask = this.GetPawnCaptureMask(square_index)
			this.IsolateMaskFromCheckOrPinRay(square_index, capture_mask)

			const capture_promotion = new BitboardClass(promotion_mask & capture_mask.Raw())
			capture_mask.And(~capture_promotion.Raw())

			capture_mask.GetBitIndices().forEach((target_index) => {
				moves.push(new Move(square_index, target_index, PIECES.PAWN))
			})

			capture_promotion.GetBitIndices().forEach((target_index) => {
				PROMOTION_PIECES.forEach((promotion_piece) => {
					moves.push(new Move(square_index, target_index, PIECES.PAWN, MOVE_INFO.PROMOTION, promotion_piece))
				})
			})
		})

		const enpassant = this.enpassant

		if (
			enpassant !== -1 &&
			(!this.in_check || (this.in_check && check_ray_mask.isOccupied(enpassant + opposite_move_direction)))
		) {
			const enpassant_mask = this.GetPawnEnpassantMask()

			if (!enpassant_mask.Raw()) return
			const indices = enpassant_mask.GetBitIndices()

			let can_check_king = false

			if (indices.length === 1) {
				const { x_ray, attack_mask: mask } = this.GetSlidingXRayMask(
					indices[0],
					board.occupancies.Raw(),
					board.occupancies.Raw(),
					this.GetHorizontalEnpassantMask
				)
				const mask_raw = mask.Raw()

				const pieces_positions =
					board[PIECES.KING][turn].Raw() |
					board[PIECES.ROOK][x_turn].Raw() |
					board[PIECES.QUEEN][x_turn].Raw()

				if (new BitboardClass(mask_raw & pieces_positions).Raw() && x_ray.And(pieces_positions).Raw()) {
					can_check_king = true
				}
			}

			if (!can_check_king) {
				indices.forEach((square_index) => {
					if (!this.isPawnPushOnRay(square_index, enpassant)) return
					moves.push(new Move(square_index, enpassant, PIECES.PAWN, MOVE_INFO.ENPASSANT))
				})
			}
		}
	}

	GenerateKnightMoves(moves) {
		this.board.GetKnightSquareIndices(this.turn).forEach((square_index) => {
			const jump_mask = this.GetKnightJumpMask(square_index)
			this.IsolateMaskFromCheckOrPinRay(square_index, jump_mask)

			jump_mask.GetBitIndices().forEach((target_index) => {
				moves.push(new Move(square_index, target_index, PIECES.KNIGHT))
			})
		})
	}

	GenerateSlidingMoves(moves) {
		const board = this.board
		const turn = this.turn

		const ally_occupancies = ~board.color[turn].Raw()

		//* Rooks
		board.GetRookSquareIndices(turn).forEach((square_index) => {
			const rook_mask = this.GetRookAttackMask(square_index).And(ally_occupancies)
			this.IsolateMaskFromCheckOrPinRay(square_index, rook_mask)

			rook_mask.GetBitIndices().forEach((target_index) => {
				moves.push(new Move(square_index, target_index, PIECES.ROOK))
			})
		})

		//* Bishops
		board.GetBishopSquareIndices(turn).forEach((square_index) => {
			const bishop_mask = this.GetBishopAttackMask(square_index).And(ally_occupancies)
			this.IsolateMaskFromCheckOrPinRay(square_index, bishop_mask)

			bishop_mask.GetBitIndices().forEach((target_index) => {
				moves.push(new Move(square_index, target_index, PIECES.BISHOP))
			})
		})

		//* Queens
		board.GetQueenSquareIndices(turn).forEach((square_index) => {
			const queen_mask = new BitboardClass(
				this.GetRookAttackMask(square_index).Raw() | this.GetBishopAttackMask(square_index).Raw()
			)
			this.IsolateMaskFromCheckOrPinRay(square_index, queen_mask.And(ally_occupancies))

			queen_mask.GetBitIndices().forEach((target_index) => {
				moves.push(new Move(square_index, target_index, PIECES.QUEEN))
			})
		})
	}

	GenerateAllPossibleMoves() {
		const moves = []

		//* Initalize check and pin rays, and opponent's attack mask
		this.ResetMoveGeneration()
		this.CalculateAttackMask()

		//* Generate possible moves
		this.GenerateKingMoves(moves)

		if (this.double_check) return moves

		this.GeneratePawnMoves(moves)
		this.GenerateKnightMoves(moves)
		this.GenerateSlidingMoves(moves)

		return moves
	}

	MakeMove(move) {
		const board = this.board
		const turn = this.turn
		const x_turn = this.x_turn

		const start_square = move.start_square
		const target_square = move.target_square
		const piece_moved = move.piece
		const move_info = move.info

		const piece_captured = board.GetPieceFromSquareIndex(target_square)

		move.enpassant = this.enpassant
		move.caslte_rights = this.caslte_rights
		this.enpassant = -1

		if (piece_captured !== -1) {
			board.CapturePiece(piece_captured, x_turn, target_square)
			move.captured = piece_captured
		}

		board.MakeMove(piece_moved, turn, start_square, target_square)
		if (move_info > 0) this.make_move_info_funcs[move_info](turn, x_turn, move)

		this.move_history.push(move)
		this.turn = x_turn
		this.x_turn = turn

		if (piece_moved === PIECES.ROOK) {
			const castle_right = CASTLE_ROOK_MOVED[start_square]
			if (!castle_right) return

			this.caslte_rights &= ~castle_right
		} else if (piece_moved === PIECES.KING) {
			const castle_rights = CASTLE_KING_MOVED[turn]
			this.caslte_rights &= castle_rights[0]
			this.caslte_rights &= castle_rights[1]
		}
	}

	UndoMove() {
		const move_history = this.move_history
		if (move_history.length === 0) return

		const move = move_history.pop()

		const board = this.board
		const turn = this.x_turn
		const x_turn = this.turn

		const start_square = move.start_square
		const target_square = move.target_square
		const move_info = move.info
		const piece_captured = move.captured

		board.UndoMove(move.piece, turn, start_square, target_square)

		if (move_info > 0) this.undo_move_info_funcs[move_info](turn, x_turn, move)
		if (piece_captured !== -1) {
			if ((move_info & MOVE_INFO.ENPASSANT) === 0) {
				board.UndoCapturedPiece(piece_captured, x_turn, target_square)
			}
		}

		this.turn = turn
		this.x_turn = x_turn
		this.enpassant = move.enpassant
		this.caslte_rights = move.caslte_rights
	}
}
