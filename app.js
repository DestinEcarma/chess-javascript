import { BitboardClass } from "./src/modules/bitboard.js"
import { ChessEngineClass } from "./src/modules/chess-engine.js"

//* Initialize magic number if need
//// import { InitMagicNumbers } from "./src/modules/magic-attacks.js"
//// InitMagicNumbers()

const chess_engine = new ChessEngineClass()

chess_engine.LoadPosition()

chess_engine.board.occupied.Set(40)
chess_engine.board.occupied.Set(33)

const pawn_attacks = chess_engine.GetPawnCaptureMask()
const test = new BitboardClass(pawn_attacks)

test.PrintBitboard()
