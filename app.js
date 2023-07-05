import { BitboardClass } from "./src/modules/bitboard.js"
import { ChessEngineClass } from "./src/modules/chess-engine.js"

//* Initialize magic number if need
import { InitMagicNumbers, InitSmallestMagicNumberPossible } from "./src/modules/magic-attacks.js"
// InitMagicNumbers(false)
InitSmallestMagicNumberPossible(100)

const chess_engine = new ChessEngineClass()

chess_engine.LoadPosition()

const sliding_attack = chess_engine.GetLevelAttackMask(9)
const test = new BitboardClass(sliding_attack)

test.PrintBitboard()
// chess_engine.board.occupied.PrintBitboard()

// chess_engine.board.occupied.Set(40)
// chess_engine.board.occupied.Set(33)

// const pawn_attacks = chess_engine.GetPawnCaptureMask()
// const test = new BitboardClass(pawn_attacks)

// test.PrintBitboard()
