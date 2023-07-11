import { BitboardClass } from "./bitboard.js"
import { BoardClass } from "./board.js"
import {
	diagonal_attacks,
	diagonal_masks,
	king_masks,
	knight_masks,
	level_attacks,
	level_masks,
	pawn_attack_masks,
	pawn_double_push_mask,
} from "./pre-moves.js"
import { DIAGONAL_MAGIC_NUMBERS, LEVEL_MAGIC_NUMBERS, DIAGONAL_BITS, LEVEL_BITS, COLOR } from "./constant-gvar.js"
import { Move } from "./Move.js"

const PAWN_SHIFT_DIRECTION = {
	[COLOR.WHITE]: "LeftShift",
	[COLOR.BLACK]: "RightShift",
}

export class ChessEngineClass {
	board = new BoardClass()

	LoadPosition(fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") {
		this.board.LoadPosition(fen)
	}

	GetPawnPushMask() {
		const board = this.board
		const turn = board.turn
		const occupancy = board.occupied.Raw()
		const shift_direction = PAWN_SHIFT_DIRECTION[turn]

		const single_push = new BitboardClass(board.pawns[turn].Raw())
		single_push[shift_direction](8n)
		single_push.And(~occupancy)

		const double_push = new BitboardClass(single_push.Raw() & pawn_double_push_mask[turn])
		double_push[shift_direction](8n).And(~occupancy)

		return { single_push, double_push }
	}

	GetPawnCaptureMask(square_index) {
		const board = this.board
		const pawn_attack_mask = new BitboardClass(pawn_attack_masks[board.turn][square_index])
		const occupancy = board.color[board.x_turn].Raw()

		return pawn_attack_mask.And(occupancy)
	}

	GetPawnEnpassantMask() {
		const board = this.board
		const enpassant = new BitboardClass(pawn_attack_masks[board.x_turn][board.enpassant])

		enpassant.And(board.color[board.turn].Raw())

		return enpassant
	}

	GetKnightJumpMask(square_index) {
		const board = this.board
		return knight_masks[square_index] & ~board.color[board.turn].Raw()
	}

	GetSlidingAttackMask(square_index, masks, magic_number, bits, attacks) {
		const board = this.board

		let occupancy = this.board.occupied.Raw()

		occupancy &= masks[square_index]
		occupancy *= magic_number[square_index]
		occupancy >>= BigInt(64 - bits[square_index])

		return new BitboardClass(attacks[square_index][occupancy] & ~board.color[board.turn].Raw())
	}

	GetRookAttackMask(square_index) {
		return this.GetSlidingAttackMask(square_index, level_masks, LEVEL_MAGIC_NUMBERS, LEVEL_BITS, level_attacks)
	}

	GetBishopAttackMask(square_index) {
		return this.GetSlidingAttackMask(
			square_index,
			diagonal_masks,
			DIAGONAL_MAGIC_NUMBERS,
			DIAGONAL_BITS,
			diagonal_attacks
		)
	}

	GetQueenAttackMask(square_index) {
		return this.GetRookAttackMask(square_index) | this.GetBishopAttackMask(square_index)
	}

	GetKingMask(square_index) {
		const board = this.board

		return new BitboardClass(king_masks[square_index] & ~board.color[board.turn])
	}

	CalculateAttackMask() {
		const sliding_attack_mask = new BitboardClass()
		const pawn_capture_mask = new BitboardClass()
		const knight_jump_mask = new BitboardClass()

		const pin_ray_mask = new BitboardClass()
		const check_ray_mask = new BitboardClass()

		

		return {
			sliding_attack_mask,
			pawn_capture_mask,
			knight_jump_mask,
		}
	}

	GeneratePawnMoves(moves = []) {
		const board = this.board

		const { single_push, double_push } = this.GetPawnPushMask()
		const shift_direction = PAWN_SHIFT_DIRECTION[board.x_turn]

		single_push.GetBitIndices().forEach((target_index) => {
			//TODO: Prevent pinned attack ray and check ray

			moves.push(new Move(Number(new BitboardClass(target_index)[shift_direction](8n).Raw()), target_index))
		})

		double_push.GetBitIndices().forEach((target_index) => {
			//TODO: Prevent pinned attack ray and check ray

			moves.push(new Move(Number(new BitboardClass(target_index)[shift_direction](8n).Raw()), target_index))
		})

		board.GetPawnSquareIndices().forEach((square_index) => {
			const capture_mask = this.GetPawnCaptureMask(square_index)
			//TODO: Prevent pinned attack ray and check ray

			capture_mask.GetBitIndices().forEach((target_index) => moves.push(new Move(square_index, target_index)))
		})
	}

	GenerateEnemyMoves() {}

	GenerateAllPossibleMoves() {
		const moves = []

		return moves
	}
}
