import { Move } from "./src/modules/Move.js"
import { BitboardClass } from "./src/modules/bitboard.js"
import { ChessEngineClass } from "./src/modules/chess-engine.js"
import { StopWatch } from "./src/modules/helper.js"

//* Initialize magic number if need
//// import { InitMagicNumbers, InitHorizontalMagicNumbers } from "./src/modules/magic-attacks.js"
//// InitMagicNumbers(true)
//// InitHorizontalMagicNumbers()

const chess_engine = new ChessEngineClass()
chess_engine.LoadPosition("r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10 ")
chess_engine.PrintBoard()

const stop_watch = StopWatch()
const moves = chess_engine.GenerateAllPossibleMoves()
console.log(stop_watch())

const test = new BitboardClass()

moves.forEach((move) => {
	test.Set(move.target_index)
})

// chess_engine.opponent_attack_mask.PrintBitboard()
test.PrintBitboard(`Number of moves: ${moves.length}`)
