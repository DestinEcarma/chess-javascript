import { MOVE_INFO } from "./constant-var.js"
import { NOTATIONS, PIECES_TYPE_FROM_VALUE } from "./constant-var.js"

export class Move {
	enpassant = -1
	captured = -1
	castle_rights = 0

	constructor(start_square, target_square, piece, info, type) {
		this.start_square = start_square
		this.target_square = target_square
		this.piece = piece
		this.info = info
		this.type = type
	}

	Notation() {
		return `${NOTATIONS[this.start_square]}${NOTATIONS[this.target_square]}${
			this.info === MOVE_INFO.PROMOTION ? PIECES_TYPE_FROM_VALUE[this.type] : ""
		}`
	}
}
