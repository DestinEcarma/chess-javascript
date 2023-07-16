import { ChessEngineClass } from "./src/modules/chess-engine.js"
import { StopWatch } from "./src/modules/helper.js"

//* Initialize magic number if need
//// import { InitMagicNumbers, InitHorizontalMagicNumbers } from "./src/modules/magic-attacks.js"
//// InitMagicNumbers(true)
//// InitHorizontalMagicNumbers()

const chess_engine = new ChessEngineClass()
chess_engine.LoadPosition("4k3/1P6/8/8/8/8/6p1/4K3 w - - 1 1")
chess_engine.PrintBoard()

const stop_watch = StopWatch()
const moves_array = chess_engine.GenerateAllPossibleMoves()
console.log(stop_watch())

const move_to_make = "b7b8n"

moves_array.forEach((move) => {
	if (move.Notation() !== move_to_make) return
	chess_engine.MakeMove(move)
})

chess_engine.PrintBoard()

chess_engine