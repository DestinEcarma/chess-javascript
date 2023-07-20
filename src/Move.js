const { MOVE_INFO } = require("./constant-var")
const { NOTATIONS, PIECE_TYPE_FROM_VALUE } = require("./constant-var")

class Move {
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
			this.info === MOVE_INFO.PROMOTION ? PIECE_TYPE_FROM_VALUE[this.type] : ""
		}`
	}
}

module.exports = { Move }
