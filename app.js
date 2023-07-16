import { ChessEngineClass } from "./src/modules/chess-engine.js"
import { StopWatch } from "./src/modules/helper.js"

//* Initialize magic number if need
//// import { InitMagicNumbers, InitHorizontalMagicNumbers } from "./src/modules/magic-attacks.js"
//// InitMagicNumbers(true)
//// InitHorizontalMagicNumbers()

const chess_engine = new ChessEngineClass()
chess_engine.LoadPosition("4k3/P7/8/2Pp4/8/8/8/4K2R w K d6 1 1")
chess_engine.PrintBoard()

const stop_watch = StopWatch()
const moves = chess_engine.GenerateAllPossibleMoves()
console.log(stop_watch())

const move_to_make = "e1g1"

moves.forEach((move) => {
	if (move.Notation() !== move_to_make) return
	chess_engine.MakeMove(move)
})

chess_engine.PrintBoard()
chess_engine.UndoMove()
chess_engine.PrintBoard()

moves.forEach((move) => {
	if (move.Notation() !== move_to_make) return
	chess_engine.MakeMove(move)
})

chess_engine.PrintBoard()
