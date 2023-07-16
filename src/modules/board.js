import { BitboardClass } from "./bitboard.js"
import { COLOR, PIECES, PIECE_FROM_CHARACTER, PIECES_TYPE_FROM_VALUE } from "./constant-var.js"

export class BoardClass {
	occupancies = new BitboardClass()
	color = this.CreateSides()

	constructor() {
		this[PIECES.KING] = this.CreateSides()
		this[PIECES.PAWN] = this.CreateSides()
		this[PIECES.KNIGHT] = this.CreateSides()
		this[PIECES.BISHOP] = this.CreateSides()
		this[PIECES.ROOK] = this.CreateSides()
		this[PIECES.QUEEN] = this.CreateSides()
	}

	LoadPiecePlacement(fen) {
		let [file, rank] = [0, 7]

		fen.split("").forEach((char) => {
			if (char !== "/") {
				if (isNaN(char)) {
					const color = char === char.toUpperCase() ? COLOR.WHITE : COLOR.BLACK
					const piece = PIECE_FROM_CHARACTER[char.toLowerCase()]

					const square_index = rank * 8 + file

					this[piece][color].Set(square_index)
					this.color[color].Set(square_index)
					this.occupancies.Set(square_index)
					file++
				} else file += Number(char)
			} else {
				file = 0
				rank--
			}
		})
	}

	GetPieceFromSquareIndex(square_index) {
		if (!this.occupancies.isOccupied(square_index)) return -1

		const turn = this.color[COLOR.WHITE].isOccupied(square_index) ? COLOR.WHITE : COLOR.BLACK

		for (let piece = 0; piece < 6; piece++) {
			if (this[piece][turn].isOccupied(square_index)) return piece
		}

		console.error(`Square index is occupied, but not found: ${square_index}`)
	}

	GetPieceTypeFromSquareIndex(square_index) {
		const piece = this.GetPieceFromSquareIndex(square_index)
		if (piece === -1) return false

		const turn = this.color[COLOR.WHITE].isOccupied(square_index) ? COLOR.WHITE : COLOR.BLACK
		const piece_type = PIECES_TYPE_FROM_VALUE[piece]

		return turn === COLOR.WHITE ? piece_type.toUpperCase() : piece_type
	}

	CreateSides() {
		return {
			[COLOR.WHITE]: new BitboardClass(),
			[COLOR.BLACK]: new BitboardClass(),
		}
	}

	GetKingSquareIndex(turn) {
		return this[PIECES.KING][turn].GetLSBIndex()
	}

	GetPawnSquareIndices(turn) {
		return this[PIECES.PAWN][turn].GetBitIndices()
	}

	GetKnightSquareIndices(turn) {
		return this[PIECES.KNIGHT][turn].GetBitIndices()
	}

	GetBishopSquareIndices(turn) {
		return this[PIECES.BISHOP][turn].GetBitIndices()
	}

	GetRookSquareIndices(turn) {
		return this[PIECES.ROOK][turn].GetBitIndices()
	}

	GetQueenSquareIndices(turn) {
		return this[PIECES.QUEEN][turn].GetBitIndices()
	}
}
