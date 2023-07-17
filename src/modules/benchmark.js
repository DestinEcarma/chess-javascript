import { ChessEngineClass } from "./chess-engine.js"
import { StopWatch } from "./helper.js"

export class Benchmark {
	constructor(fen_string) {
		this.chess_engine = new ChessEngineClass()
		this.chess_engine.LoadPosition(fen_string)
		this.chess_engine.PrintBoard()
	}

	Perft(depth, fen_string) {
		if (fen_string) this.chess_engine.LoadPosition(fen_string)

		const stop_watch = StopWatch()

		let nodes = 0

		const chess_engine = this.chess_engine
		const moves = chess_engine.GenerateAllPossibleMoves()

		for (let move of moves) {
			let show = false

			chess_engine.MakeMove(move, show)
			const move_nodes = this._Perft(depth - 1, show)
			chess_engine.UndoMove()

			nodes += move_nodes
			console.log(`${move.Notation()}: ${move_nodes}`)
		}

		const seconds = stop_watch()

		console.log()
		console.log(`Total time     : ${seconds}s`)
		console.log(`Nodes searched : ${nodes}`)
		console.log(`Nodes/second   : ${Math.round(nodes / seconds)}`)
	}

	_Perft(depth) {
		if (depth === 0) {
			return 1
		}

		let nodes = 0

		const chess_engine = this.chess_engine
		const moves = chess_engine.GenerateAllPossibleMoves()

		for (let move of moves) {
			chess_engine.MakeMove(move)
			nodes += this._Perft(depth - 1)
			chess_engine.UndoMove()
		}

		return nodes
	}
}
