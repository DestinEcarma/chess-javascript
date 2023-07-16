import { MOVE_INFO } from "./constant-var.js"
import { NOTATIONS } from "./constant-var.js"

export class Move {
	constructor(square_index, target_index, piece, info, type) {
		this.square_index = square_index
		this.target_index = target_index
		this.piece = piece
		this.info = info
		this.type = type
	}

	Notation() {
		return `${NOTATIONS[this.square_index]}${NOTATIONS[this.target_index]}`
	}
}
