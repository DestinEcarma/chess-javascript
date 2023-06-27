import { piece as Piece, piece_type_symbol, piece_type_bytes, caslte } from "./piece.js"

const COLOR_MASK = Piece.WHITE | Piece.BLACK

export default class board {
	constructor(fen) {
		this.piece = new Uint8Array(64).fill(0)
		this.color = new Uint8Array(64).fill(0)
		this.king_square = {
			[Piece.WHITE]: 0,
			[Piece.BLACK]: 0,
		}
		this.positions = {
			[Piece.WHITE]: [],
			[Piece.BLACK]: [],
		}

		this.turn = Piece.WHITE
		this.x_turn = Piece.BLACK
		this.enpasant = -1
		this.castle = 0

		this.load_position(fen)
	}

	load_position(fen) {
		const fen_split = fen.split(" ")

		const fen_board = fen_split[0]
		let [file, rank] = [0, 7]

		fen_board.split("").forEach((symbol) => {
			if (symbol === "/") {
				file = 0
				rank--
			} else {
				if (isNaN(symbol)) {
					const piece_color = symbol === symbol.toUpperCase() ? Piece.WHITE : Piece.BLACK
					const piece_type = Piece[piece_type_symbol[symbol.toLowerCase()]]

					const position = rank * 8 + file

					if (piece_type === Piece.KING) {
						this.king_square[piece_color] = position
					}

					this.piece[position] = piece_type
					this.color[position] = piece_color
					this.positions[piece_color].push(position)
					file++
				} else file += Number(symbol)
			}
		})

		if (fen_split[1] === "w") {
			this.turn = Piece.WHITE
			this.x_turn = Piece.BLACK
		} else {
			this.turn = Piece.BLACK
			this.x_turn = Piece.WHITE
		}

		if (fen_split[2] !== "-")
			fen_split[2].split("").forEach((symbol) => (this.castle = caslte[symbol] | this.castle))
	}

	print_board() {
		for (let rank = 7; rank >= 0; rank--) {
			const row = new Array(8)

			for (let file = 0; file < 8; file++) {
				const position = rank * 8 + file

				let piece = piece_type_bytes[this.piece[position]]
				if (this.color[position] === Piece.WHITE) piece = piece.toUpperCase()

				row[file] = piece
			}

			console.log(String(rank + 1), "|", row.join(" | "))
		}

		console.log("—————————————————————————————————")
		console.log("  | a | b | c | d | e | f | g | h")
	}

	is_color(piece, color) {
		return (piece & COLOR_MASK) === color
	}

	is_sliding_piece(piece) {
		return (piece & 4) !== 0
	}

	is_rook_queen(piece) {
		return (piece & 6) === 6
	}

	is_bishop_queen(piece) {
		return (piece & 5) === 5
	}

	is_type(piece, type) {
		return (piece & type) === type
	}
}
