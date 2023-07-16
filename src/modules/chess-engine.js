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
	CASTLE_OCCUPANCIES,
	CASTLE_SQUARE_INDEX,
	PAWN_SHIFT_DIRECTION,
	PAWN_MOVE_DIRECTION,
	PAWN_PROMOTION_MASK,
	PROMOTION_PIECES,
} from "./constant-var.js"
import { Move } from "./Move.js"

export class ChessEngineClass {
	board = new BoardClass()

	turn = COLOR.WHITE
	x_turn = COLOR.BLACK

	enpassant = -1
	caslte_rights = 0

	opponent_attack_mask = new BitboardClass()
	check_ray_mask = new BitboardClass()
	pin_ray_mask = new BitboardClass()

	double_check = false
	in_check = false

	active_king_square_index = -1

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
		}

		//* Possible En Passant targets
		if (fen_split[3] !== "-") {
			this.enpassant = INDEX_FROM_NOTATION[fen_split[3].toLowerCase()]
		}

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

				board_string += `| ${board.GetPieceTypeFromSquareIndex(rank * 8 + file) || "\u22C5"} `
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
		this.pin_ray_mask.Zero()

		this.double_check = false
		this.in_check = false
	}

	GetPawnPushMask() {
		const board = this.board
		const turn = this.turn
		const occupancies = board.occupancies.Raw()
		const shift_direction = PAWN_SHIFT_DIRECTION[turn]

		const single_push = new BitboardClass(board[PIECES.PAWN][turn].Raw())
		single_push[shift_direction](8n)
		single_push.And(~occupancies)

		const double_push = new BitboardClass(single_push.Raw() & pawn_double_push_mask[turn])
		double_push[shift_direction](8n).And(~occupancies)

		return { single_push, double_push }
	}

	GetPawnCaptureMask(square_index, turn, x_turn) {
		const pawn_attack_mask = new BitboardClass(pawn_capture_masks[turn ?? this.turn][square_index])
		const occupancies = this.board.color[x_turn ?? this.x_turn].Raw()

		return pawn_attack_mask.And(occupancies)
	}

	GetPawnEnpassantMask() {
		const enpassant = new BitboardClass(pawn_capture_masks[this.x_turn][this.enpassant])
		enpassant.And(this.board.color[this.turn].Raw())

		return enpassant
	}

	GetKnightJumpMask(square_index, turn) {
		return new BitboardClass(knight_masks[square_index] & ~this.board.color[turn ?? this.turn].Raw())
	}

	GetSlidingAttackMask(square_index, masks, magic_number, bits, attacks, occupancies) {
		occupancies &= masks[square_index]
		occupancies *= magic_number[square_index]
		occupancies >>= BigInt(64 - bits[square_index])

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

	GenerateCheckAndPinRays(attacking_pices, rook = true) {
		const king_square_index = this.active_king_square_index

		//* Stop's the function if it's a double check, only the king can move from this point
		if (this.double_check) return

		const get_attack_mask = rook ? "GetRookAttackMask" : "GetBishopAttackMask"
		const get_x_ray_attack_mask = rook ? "GetRookXRayAttackMask" : "GetBishopXRayAttackMask"

		const attack = this[get_attack_mask](king_square_index).Raw()
		const attackers = new BitboardClass(attack & attacking_pices)

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
		//* Check's if a piece is pinned, this include the king's square index on the ray
		else {
			const { x_ray, attack_mask } = this[get_x_ray_attack_mask](king_square_index)
			const x_ray_raw = x_ray.Raw()

			const pinner = new BitboardClass(x_ray_raw & attacking_pices)

			if (pinner.Raw()) {
				pinner.GetBitIndices().forEach((square_index) => {
					const { x_ray: pinner_xr, attack_mask: pinner_am } = this[get_x_ray_attack_mask](square_index)

					this.pin_ray_mask.Or(pinner_xr.Raw() | x_ray_raw | (attack_mask.Raw() & pinner_am.Raw()))
				})
			}
		}
	}

	CalculateAttackMask() {
		const board = this.board
		const turn = this.turn
		const x_turn = this.x_turn

		const king_bitbaord = board[PIECES.KING][turn].Raw()

		const queens = board[PIECES.QUEEN][x_turn]
		const queens_bitboard = queens.Raw()

		//* Opponent king moves
		this.opponent_attack_mask.Or(king_masks[board.GetKingSquareIndex(x_turn)])

		//* Level check and pin rays
		this.GenerateCheckAndPinRays(board[PIECES.ROOK][x_turn].Raw() | queens_bitboard, true)

		//* Diagonal check and pin rays
		this.GenerateCheckAndPinRays(board[PIECES.BISHOP][x_turn].Raw() | queens_bitboard, false)

		//* Remove's the king square index from pin ray mask
		this.pin_ray_mask.Clear(this.active_king_square_index)

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
			const opponent_occ = ~board.color[x_turn].Raw()

			const queen_indices = queens.GetBitIndices()

			//* Rook or queen
			;[...board.GetRookSquareIndices(x_turn), ...queen_indices].forEach((square_index) => {
				const attack_mask = this.GetRookAttackMask(square_index, no_king_occ).And(opponent_occ).Raw()

				this.opponent_attack_mask.Or(attack_mask)
			})

			//* Bishop or queen
			;[...board.GetBishopSquareIndices(x_turn), ...queen_indices].forEach((square_index) => {
				const attack_mask = this.GetBishopAttackMask(square_index, no_king_occ).And(opponent_occ).Raw()

				this.opponent_attack_mask.Or(attack_mask)
			})
		}
	}

	//* Does not work for pawn push
	IsolateMaskFromCheckOrPinRay(square_index, mask) {
		if (this.in_check) {
			mask.And(this.check_ray_mask.Raw())
		} else if (this.pin_ray_mask.isOccupied(square_index)) {
			mask.And(this.pin_ray_mask.Raw())
		}
	}

	GenerateKingMoves(moves = []) {
		const board = this.board

		const square_index = this.active_king_square_index
		const opponent_attack_mask = this.opponent_attack_mask.Raw()

		const king_mask = new BitboardClass(king_masks[square_index])
		king_mask.And(~board.color[this.turn].Raw())
		king_mask.And(~opponent_attack_mask)

		king_mask.GetBitIndices().forEach((target_square) => {
			moves.push(new Move(square_index, target_square, PIECES.KING))
		})

		//* Castling moves
		if (this.in_check) return
		const occupancies = ~(opponent_attack_mask | board.occupancies.Raw())

		CASTLE_OCCUPANCIES.forEach(([castle_right, castle_occupancies]) => {
			if (!(this.caslte_rights & castle_right)) return
			if ((castle_occupancies & occupancies) !== castle_occupancies) return

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

		const pin_ray_mask = this.pin_ray_mask
		const check_ray_mask = this.check_ray_mask

		const { single_push, double_push } = this.GetPawnPushMask()
		const pinned_pawns = new BitboardClass(board[PIECES.PAWN][turn].Raw() & pin_ray_mask.Raw())

		if (this.in_check) {
			const raw = check_ray_mask.Raw()

			single_push.And(raw)
			double_push.And(raw)
		}

		let promotion = promotion_mask & single_push.Raw()
		const opposite_move_direction = PAWN_MOVE_DIRECTION[x_turn]

		single_push.And(~promotion)

		single_push.GetBitIndices().forEach((target_index) => {
			const square_index = target_index + opposite_move_direction

			//* Check's if square index is pinned
			if (pinned_pawns.isOccupied(square_index)) {
				//* Return's if the target square is not on the pin ray mask
				if (!pin_ray_mask.isOccupied(target_index)) return
			}

			moves.push(new Move(square_index, target_index, PIECES.PAWN))
		})

		double_push.GetBitIndices().forEach((target_index) => {
			const square_index = target_index + opposite_move_direction * 2

			//* Check's if square index is pinned
			if (pinned_pawns.isOccupied(square_index)) {
				//* Return's if the target square is not on the pin ray mask
				if (!pin_ray_mask.isOccupied(target_index)) return
			}

			moves.push(new Move(square_index, target_index, PIECES.PAWN, MOVE_INFO.DOUBLE_PAWN_PUSH))
		})

		board.GetPawnSquareIndices(turn).forEach((square_index) => {
			const capture_mask = this.GetPawnCaptureMask(square_index)
			this.IsolateMaskFromCheckOrPinRay(square_index, capture_mask)

			promotion |= promotion_mask & capture_mask.Raw()
			capture_mask.And(~promotion)

			capture_mask.GetBitIndices().forEach((target_index) => {
				moves.push(new Move(square_index, target_index, PIECES.PAWN))
			})
		})

		new BitboardClass(promotion).GetBitIndices().forEach((target_index) => {
			const square_index = target_index + opposite_move_direction

			PROMOTION_PIECES.forEach((promotion_piece) => {
				moves.push(new Move(square_index, target_index, PIECES.PAWN, MOVE_INFO.PROMOTION, promotion_piece))
			})
		})

		const enpassant = this.enpassant

		if (enpassant !== -1 && (!this.in_check || (this.in_check && check_ray_mask.isOccupied(enpassant)))) {
			const enpassant_mask = this.GetPawnEnpassantMask()

			if (!enpassant_mask.Raw()) return
			const indices = enpassant_mask.GetBitIndices()

			let can_check_king = false

			if (indices.length === 1) {
				const { x_ray, attack_mask: mask } = this.GetSlidingXRayMask(
					indices[0],
					board.occupancies.Raw(),
					board.occupancies.Raw(),
					"GetHorizontalEnpassantMask"
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
				moves.push(new Move(square_index, target_index, PIECES.PAWN))
			})
		})
	}

	GenerateSlidingMoves(moves) {
		const board = this.board
		const turn = this.turn

		const queen_indices = board.GetQueenSquareIndices(turn)
		const ally_occupancies = ~board.color[turn].Raw()

		//* Rooks and Queens moves
		;[...board.GetRookSquareIndices(turn), ...queen_indices].forEach((square_index) => {
			const rook_mask = this.GetRookAttackMask(square_index).And(ally_occupancies)
			this.IsolateMaskFromCheckOrPinRay(square_index, rook_mask)

			rook_mask.GetBitIndices().forEach((target_index) => {
				moves.push(new Move(square_index, target_index, PIECES.PAWN))
			})
		})

		//* Bishops and Queens moves
		;[...board.GetBishopSquareIndices(turn), ...queen_indices].forEach((square_index) => {
			const bishop_mask = this.GetBishopAttackMask(square_index).And(ally_occupancies)
			this.IsolateMaskFromCheckOrPinRay(square_index, bishop_mask)

			bishop_mask.GetBitIndices().forEach((target_index) => {
				moves.push(new Move(square_index, target_index, PIECES.PAWN))
			})
		})
	}

	GenerateAllPossibleMoves() {
		const moves = []

		//* Initalize check and pin rays, and opponent's attack mask
		this.ResetMoveGeneration()
		this.CalculateAttackMask()

		this.GenerateKingMoves(moves)

		if (this.double_check) return moves

		this.GeneratePawnMoves(moves)
		this.GenerateKnightMoves(moves)
		this.GenerateSlidingMoves(moves)

		return moves
	}
}
