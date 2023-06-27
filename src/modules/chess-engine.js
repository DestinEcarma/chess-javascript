import { BitboardClass } from "./bitboard.js"
import { BoardClass } from "./board.js"
import {
	diagonal_attacks,
	diagonal_masks,
	knight_masks,
	level_attacks,
	level_masks,
	not_file0_mask,
	not_file7_mask,
	pawn_double_push_mask,
} from "./pre-moves.js"
import { DIAGONAL_MAGIC_NUMBERS, LEVEL_MAGIC_NUMBERS, DIAGONAL_BITS, LEVEL_BITS, COLOR } from "./constant-gvar.js"

const PAWN_DIRECTION_SHIFT = {
	[COLOR.WHITE]: "LeftShift",
	[COLOR.BLACK]: "RightShift",
}

const PAWN_NOT_FILE_CAPTURE = {
	[COLOR.WHITE]: [not_file0_mask, not_file7_mask],
	[COLOR.BLACK]: [not_file7_mask, not_file0_mask],
}

export class ChessEngineClass {
	board = new BoardClass()

	LoadPosition(fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1") {
		this.board.LoadPosition(fen)
	}

	GetPawnPushMask() {
		const turn = this.board.turn
		const occupancy = this.board.occupied.Raw()
		const shift_direction = PAWN_DIRECTION_SHIFT[turn]

		const single_push = new BitboardClass(this.board.pawns[turn].Raw())
		single_push[shift_direction](8n)
		single_push.And(~occupancy)

		const double_push = new BitboardClass(single_push.Raw() & pawn_double_push_mask[turn])
		double_push[shift_direction](8n)

		return [single_push.Raw(), double_push.And(~occupancy).Raw()]
	}

	GetPawnCaptureMask() {
		const turn = this.board.turn
		const pawns = new BitboardClass(this.board.pawns[turn].Raw()).Raw()

		const left_capture = new BitboardClass(pawns)
		const right_capture = new BitboardClass(pawns)
		const shift_direction = PAWN_DIRECTION_SHIFT[turn]
		const not_file = PAWN_NOT_FILE_CAPTURE[turn]

		left_capture.And(not_file[0])[shift_direction](7n)
		right_capture.And(not_file[1])[shift_direction](9n)

		return left_capture.Or(right_capture.Raw()).And(this.board.color[this.board.x_turn].Raw()).Raw()
	}

	GetKnightJumpMask(square_index) {
		return knight_masks[square_index] & ~this.board.color[this.board.turn].Raw()
	}

	GetSlidingAttackMask(square_index, masks, magic_number, bits, attacks) {
		let occupancy = this.board.occupied.Raw()

		occupancy &= masks[square_index]
		occupancy *= magic_number[square_index]
		occupancy >>= BigInt(64 - bits[square_index])

		return attacks[square_index][occupancy] & ~this.board.color[this.board.turn].Raw()
	}

	GetLevelAttackMask(square_index) {
		return this.GetSlidingAttackMask(square_index, level_masks, LEVEL_MAGIC_NUMBERS, LEVEL_BITS, level_attacks)
	}

	GetDiagonalAttackMask(square_index) {
		return this.GetSlidingAttackMask(
			square_index,
			diagonal_masks,
			DIAGONAL_MAGIC_NUMBERS,
			DIAGONAL_BITS,
			diagonal_attacks
		)
	}
}
