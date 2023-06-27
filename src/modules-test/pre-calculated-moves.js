import { piece } from "./piece.js"
import url from "url"
import fs from "fs"
import path from "path"

const FORCE_UPDATE = false

const PRE_MOVES_DATA_PATH = path.join(url.fileURLToPath(import.meta.url), "..", "..", "pre-moves-data.json")

const LEVEL_DIRECTION_OFFSETS = [8, -8, -1, 1]
const DIAGONAL_DIRECTION_OFFSETS = [7, -7, 9, -9]
const KNIGHT_JUMPS = [17, 15, 10, 6, -6, -10, -15, -17]

function generate_pre_moves_data() {
	const level_moves = []
	const diagonal_moves = []
	const king_moves = []
	const knight_moves = []
	const pawn_moves = {
		[piece.WHITE]: [],
		[piece.BLACK]: [],
	}
	const pawn_attacks = {
		[piece.WHITE]: [],
		[piece.BLACK]: [],
	}

	for (let file = 0; file < 8; file++) {
		for (let rank = 0; rank < 8; rank++) {
			const num_north = 7 - rank
			const num_south = rank
			const num_west = file
			const num_east = 7 - file

			const square_index = rank * 8 + file

			const level_num_to_edge = [num_north, num_south, num_west, num_east]
			level_moves[square_index] = []

			const diagonal_num_to_edge = [
				Math.min(num_north, num_west),
				Math.min(num_south, num_east),
				Math.min(num_north, num_east),
				Math.min(num_south, num_west),
			]
			diagonal_moves[square_index] = []
			const _king_moves = []

			for (let direction_index = 0; direction_index < 4; direction_index++) {
				const _level_moves = []
				const _diagonal_moves = []

				for (let n = 0; n < level_num_to_edge[direction_index]; n++) {
					const target_square = square_index + LEVEL_DIRECTION_OFFSETS[direction_index] * (n + 1)

					if (n === 0) _king_moves.push(target_square)
					_level_moves.push(target_square)
				}

				for (let n = 0; n < diagonal_num_to_edge[direction_index]; n++) {
					const target_square = square_index + DIAGONAL_DIRECTION_OFFSETS[direction_index] * (n + 1)

					if (n === 0) _king_moves.push(target_square)
					_diagonal_moves.push(target_square)
				}

				if (_level_moves.length > 0) level_moves[square_index].push(_level_moves)
				if (_diagonal_moves.length > 0) diagonal_moves[square_index].push(_diagonal_moves)
			}

			king_moves[square_index] = _king_moves
			knight_moves[square_index] = []

			for (let knight_jump of KNIGHT_JUMPS) {
				const knight_jump_square = square_index + knight_jump

				if (knight_jump_square >= 0 && knight_jump_square < 64) {
					const knight_square_y = Math.floor(knight_jump_square / 8)
					const knight_square_x = Math.floor(knight_jump_square - knight_square_y * 8)

					const max_coord_move_dst = Math.max(
						Math.abs(file - knight_square_x),
						Math.abs(rank - knight_square_y)
					)
					if (max_coord_move_dst === 2) knight_moves[square_index].push(knight_jump_square)
				}
			}

			if (square_index < 56) {
				const attacks = []

				if (file > 0) attacks.push(square_index + 7)
				if (file < 7) attacks.push(square_index + 9)

				pawn_moves[piece.WHITE][square_index] = square_index + 8
				pawn_attacks[piece.WHITE][square_index] = attacks
			}
			if (square_index >= 8) {
				const attacks = []

				if (file > 0) attacks.push(square_index - 9)
				if (file < 7) attacks.push(square_index - 7)

				pawn_moves[piece.BLACK][square_index] = square_index - 8
				pawn_attacks[piece.BLACK][square_index] = attacks
			}
		}
	}

	return {
		level_moves,
		diagonal_moves,
		king_moves,
		knight_moves,
		pawn_moves,
		pawn_attacks,
	}
}

let _level_moves, _diagonal_moves, _king_moves, _knight_moves, _pawn_moves, _pawn_attacks

if (fs.existsSync(PRE_MOVES_DATA_PATH) && !FORCE_UPDATE) {
	try {
		const data = JSON.parse(await fs.promises.readFile(PRE_MOVES_DATA_PATH))

		_level_moves = data.level_moves
		_diagonal_moves = data.diagonal_moves
		_king_moves = data.king_moves
		_knight_moves = data.knight_moves
		_pawn_moves = data.pawn_moves
		_pawn_attacks = data.pawn_attacks
	} catch (err) {
		console.error(err)
	}
} else {
	const data = generate_pre_moves_data()
	const json_string = JSON.stringify(data)

	try {
		await fs.promises.writeFile(PRE_MOVES_DATA_PATH, json_string, "utf-8")
	} catch (err) {
		console.error(err)
	}

	_level_moves = data.level_moves
	_diagonal_moves = data.diagonal_moves
	_king_moves = data.king_moves
	_knight_moves = data.knight_moves
	_pawn_moves = data.pawn_moves
	_pawn_attacks = data.pawn_attacks
}

export const level_moves = _level_moves
export const diagonal_moves = _diagonal_moves
export const king_moves = _king_moves
export const knight_moves = _knight_moves
export const pawn_moves = _pawn_moves
export const pawn_attacks = _pawn_attacks