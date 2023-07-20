const { BitboardClass } = require("./bitboard")
const { COLOR, PIECES, PIECE_FROM_CHARACTER, PIECE_TYPE_FROM_VALUE } = require("./constant-var")

class BoardClass {
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

	ClearBoard() {
		this.occupancies.Zero()
		this.color[COLOR.WHITE].Zero()
		this.color[COLOR.BLACK].Zero()

		for (let piece = 0; piece < 6; piece++) {
			this[piece][COLOR.WHITE].Zero()
			this[piece][COLOR.BLACK].Zero()
		}
	}

	MakeMove(piece, turn, start_square, target_square) {
		const occupancies = this.occupancies
		const ally = this.color[turn]
		const piece_bitbaord = this[piece][turn]

		occupancies.Clear(start_square)
		occupancies.Set(target_square)
		ally.Clear(start_square)
		ally.Set(target_square)
		piece_bitbaord.Clear(start_square)
		piece_bitbaord.Set(target_square)
	}

	UndoMove(piece, turn, start_square, target_square) {
		this.MakeMove(piece, turn, target_square, start_square)
	}

	CapturePiece(piece, x_turn, target_square) {
		this.occupancies.Clear(target_square)
		this.color[x_turn].Clear(target_square)
		this[piece][x_turn].Clear(target_square)
	}

	UndoCapturedPiece(piece, x_turn, target_square) {
		this.occupancies.Set(target_square)
		this.color[x_turn].Set(target_square)
		this[piece][x_turn].Set(target_square)
	}

	PromotePawn(promotion_piece, turn, square_index) {
		this[PIECES.PAWN][turn].Clear(square_index)
		this[promotion_piece][turn].Set(square_index)
	}

	UndoPromotion(promotion_piece, turn, square_index) {
		this[promotion_piece][turn].Clear(square_index)
	}

	LoadPiecePlacement(fen) {
		this.ClearBoard()

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
		const piece_type = PIECE_TYPE_FROM_VALUE[piece]

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

module.exports = { BoardClass }
