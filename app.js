import { BitboardClass } from "./src/modules/bitboard.js"
import { ChessEngineClass } from "./src/modules/chess-engine.js"

//* Initialize magic number if need
// // import { InitMagicNumbers, InitSmallestMagicNumberPossible } from "./src/modules/magic-attacks.js"
// // InitMagicNumbers(true)
// // InitSmallestMagicNumberPossible(10)

const chess_engine = new ChessEngineClass()

chess_engine.LoadPosition()

chess_engine.board.occupied.PrintBitboard()

console.log(chess_engine.board.GetKingSquareIndex())
