import { Benchmark } from "./benchmark.js"

const benchmark = new Benchmark()

// prettier-ignore
const VALID_ENPASSANT = [
	"a5", "b5", "c5", "d5", "e5", "f5", "g5", "h5",
	"a4", "b4", "c4", "d4", "e4", "f4", "g4", "h4",
]

const VALID_CASTLE_RIGHTS = ["K", "Q", "k", "q"]

function exit() {
	RUNNING = false
}

function isFenStringValid(fen) {
	if (!fen) return false

	const fen_split = fen.split(" ")
	const rows = fen_split[0].split("/")
	if (rows.length !== 8) return false

	const kings = {}

	for (let row of rows) {
		let files = 0

		for (let char of row.split("")) {
			if (!isNaN(char)) {
				files += Number(char)
				continue
			}

			const is_king = char.toLowerCase() === "k"
			files++

			if (is_king) {
				if (kings[char]) return false
				kings[char] = true
			}
		}

		if (files !== 8) return false
	}

	const turn = fen_split[1].toLowerCase()
	if (!(turn === "w" || turn === "b")) return false

	if (fen_split[2] !== "-") {
		for (let char of fen_split[2].split("")) {
			if (VALID_CASTLE_RIGHTS.findIndex((_char) => char === _char) >= 0) continue
			return false
		}
	}

	const enpassnt = fen_split[3]
	if (enpassnt !== "-") {
		if (VALID_ENPASSANT.findIndex((notation) => notation === enpassnt) < 0) return false
	}

	return true
}

function perft(params) {
	const depth = params.shift()
	const fen = params && params.length > 0 ? params.reduce((prev, string) => `${prev} ${string}`) : "current"

	if (isNaN(depth)) return console.log("Invalid parameters!")
	if (fen !== "current") {
		if (!isFenStringValid(fen)) return console.log("Invalid fen string!")
		benchmark.chess_engine.LoadPosition(fen)
	}

	benchmark.Perft(Number(depth))
}

function position(params) {
	if (!params) console.log("Invalid parameters!")
	const fen = params.reduce((prev, string) => `${prev} ${string}`)

	if (!isFenStringValid(fen)) console.log("Invalid fen string!")
	benchmark.chess_engine.LoadPosition(fen)
}

function display() {
	benchmark.chess_engine.PrintBoard()
}

export let RUNNING = true

export const COMMANDS = {
	["position fen"]: position,
	["go perft"]: perft,
	["exit"]: exit,
	["d"]: display,
}
