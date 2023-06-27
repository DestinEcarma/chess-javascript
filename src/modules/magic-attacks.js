import { BitboardClass } from "./bitboard.js"
import {
	level_masks,
	diagonal_masks,
	level_squares,
	diagonal_squares,
	level_attacks,
	diagonal_attacks,
} from "./pre-moves.js"
import { LEVEL_MAGIC_NUMBERS, DIAGONAL_MAGIC_NUMBERS, LEVEL_BITS, DIAGONAL_BITS } from "./constant-gvar.js"

export function MaskSlidingAttaks(occupancies, target_squares) {
	const bitboard_occupancies = new BitboardClass(occupancies)
	const bitboard_mask = new BitboardClass()

	for (let target_square_list of target_squares) {
		for (let target_square of target_square_list) {
			bitboard_mask.Set(target_square)

			if (bitboard_occupancies.Occupied(target_square)) break
		}
	}

	return bitboard_mask.Raw()
}

export function IndexToUBigInt64(index, bits, mask) {
	const bitboard_mask = new BitboardClass(mask)

	let result = 0n

	for (let i = 0; i < bits; i++) {
		const square = bitboard_mask.PopLSB()

		if (index & (1 << i)) result |= 1n << BigInt(square)
	}

	return result
}

function GenerateUInt16() {
	return (Math.random() * 0xffff) & 0xffff
}

function GenerateUBigInt64() {
	const u1 = BigInt(GenerateUInt16())
	const u2 = BigInt(GenerateUInt16())
	const u3 = BigInt(GenerateUInt16())
	const u4 = BigInt(GenerateUInt16())

	return u1 | (u2 << 16n) | (u3 << 32n) | (u4 << 48n)
}

function GenerateMagicNumber() {
	return GenerateUBigInt64() & GenerateUBigInt64() & GenerateUBigInt64()
}

function FindMagicNumber(square_index, bits, diagonal) {
	const occupancies = new Array(4096)
	const attacks = new Array(4096)
	const used_attacks = new Array(4096).fill(0n)

	const attack_mask = diagonal ? diagonal_masks[square_index] : level_masks[square_index]
	const target_squares = diagonal ? diagonal_squares[square_index] : level_squares[square_index]
	const occupancy_indicies = 1 << bits

	for (let index = 0; index < occupancy_indicies; index++) {
		occupancies[index] = IndexToUBigInt64(index, occupancy_indicies, attack_mask)
		attacks[index] = MaskSlidingAttaks(occupancies[index], target_squares)
	}

	let fail = 0

	for (let _ = 0; _ < 100000000; _++) {
		const magic_number = GenerateMagicNumber()

		if (BigInt(new BitboardClass((attack_mask * magic_number) & 0xff00000000000000n).CountBits()) < 6) continue

		for (let index = 0, fail; !fail && index < occupancy_indicies; index++) {
			const magic_index = (occupancies[index] * magic_number) >> (64n - BigInt(bits))

			if (used_attacks[magic_index] === 0n) {
				used_attacks[magic_index] = attacks[index]
			} else if (used_attacks[magic_index] !== attacks[index]) {
				fail = 1
			}
		}

		if (!fail) return magic_number
	}

	console.log("***Magic number failed***")
	return 0n
}

export function InitSlidingAttacks(diagonal) {
	for (let square_index = 0; square_index < 64; square_index++) {
		const attack_mask = diagonal ? diagonal_masks[square_index] : level_masks[square_index]
		const bits = new BitboardClass(attack_mask).CountBits()

		const occupancy_indicies = 1 << bits

		if (level_attacks[square_index] == null) level_attacks[square_index] = []
		if (diagonal_attacks[square_index] == null) diagonal_attacks[square_index] = []

		for (let index = 0; index < occupancy_indicies; index++) {
			const occupancy = IndexToUBigInt64(index, bits, attack_mask)

			if (diagonal) {
				const magic_index =
					(occupancy * DIAGONAL_MAGIC_NUMBERS[square_index]) >> BigInt(64 - DIAGONAL_BITS[square_index])

				diagonal_attacks[square_index][magic_index] = MaskSlidingAttaks(
					occupancy,
					diagonal_squares[square_index]
				)
			} else {
				const magic_index =
					(occupancy * LEVEL_MAGIC_NUMBERS[square_index]) >> BigInt(64 - LEVEL_BITS[square_index])

				level_attacks[square_index][magic_index] = MaskSlidingAttaks(occupancy, level_squares[square_index])
			}
		}
	}
}

export function InitMagicNumbers() {
	console.log("Bishop magic numbers")
	for (let square_index = 0; square_index < 64; square_index++) {
		console.log(
			`${FindMagicNumber(square_index, DIAGONAL_BITS[square_index], diagonal_squares[square_index], true)}n,`
		)
	}

	console.log("\nRook magic numbers")
	const start = Date.now()
	for (let square_index = 0; square_index < 64; square_index++) {
		console.log(`${FindMagicNumber(square_index, LEVEL_BITS[square_index], level_squares[square_index], false)}n,`)
	}

	console.log("\nMagic number generation complete")
	console.log((Date.now() - start) / 1000)
}
