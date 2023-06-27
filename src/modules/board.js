import { BitboardClass } from "./bitboard.js"
import { COLOR } from "./constant-gvar.js"

const PIECE_FULL_NAME_FROM_LETTER = {
	k: "king",
	p: "pawns",
	n: "knights",
	b: "bishops",
	r: "rooks",
	q: "queens",
}

const CASTLE_RIGHTS_FROM_LETTER = {
	K: 1,
	Q: 2,
	k: 4,
	q: 8,
}

export class BoardClass {
	occupied = new BitboardClass()
	color = this.CreateSides()

	king = this.CreateSides()
	pawns = this.CreateSides()
	knights = this.CreateSides()
	bishops = this.CreateSides()
	rooks = this.CreateSides()
	queens = this.CreateSides()

	caslte_rights = 0
	enpassant = -1

	turn = COLOR.WHITE
	x_turn = COLOR.BLACK

	LoadPosition(fen) {
		const fen_split = fen.split(" ")

		{
			let [file, rank] = [0, 7]

			//* Generate the bitboards of every pieces from fen string
			fen_split[0].split("").forEach((char) => {
				if (char !== "/") {
					if (isNaN(char)) {
						const color = char === char.toUpperCase() ? COLOR.WHITE : COLOR.BLACK
						const piece = PIECE_FULL_NAME_FROM_LETTER[char.toLowerCase()]

						const square_index = rank * 8 + file

						this[piece][color].Set(square_index)
						this.color[color].Set(square_index)
						this.occupied.Set(square_index)
						file++
					} else file += Number(char)
				} else {
					file = 0
					rank--
				}
			})

			//* Identify whose turn from fen string
			if (fen_split[1] === "w") {
				this.turn = COLOR.WHITE
				this.x_turn = COLOR.BLACK
			} else {
				this.turn = COLOR.BLACK
				this.x_turn = COLOR.WHITE
			}

			//* Generate castle rights from fen string
			if (fen_split[2] !== "-") {
				fen_split[2].split("").forEach((char) => {
					this.caslte_rights |= CASTLE_RIGHTS_FROM_LETTER[char]
				})
			}

			//TODO: Generate enpassant from fen string

			//TODO: Generate 50 move draw from fen string

			//TODO: Forgot the other one
		}
	}

	CreateSides() {
		return {
			[COLOR.WHITE]: new BitboardClass(),
			[COLOR.BLACK]: new BitboardClass(),
		}
	}
}
