import { Benchmark } from "./src/modules/benchmark.js"
import { BitboardClass } from "./src/modules/bitboard.js";
import { ChessEngineClass } from "./src/modules/chess-engine.js"
import { StopWatch } from "./src/modules/helper.js"

//* Initialize magic number if need
// import { InitMagicNumbers, InitHorizontalMagicNumbers } from "./src/modules/magic-attacks.js"
// InitMagicNumbers(true)
//// InitHorizontalMagicNumbers()


const test = new Benchmark("8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1")

test.Perft(6)

// const chess_engine = new ChessEngineClass()
// chess_engine.LoadPosition("rnbqkbnr/pp1ppppp/2p5/7Q/4P3/8/PPPP1PPP/RNB1KBNR b KQkq - 0 1")

// chess_engine.ResetMoveGeneration()
// chess_engine.CalculateAttackMask()

// chess_engine.GeneratePawnMoves([])