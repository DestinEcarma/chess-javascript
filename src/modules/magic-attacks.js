import { BitboardClass } from "./bitboard.js"
import { level_masks, diagonal_masks, level_squares, diagonal_squares } from "./pre-moves.js"
import { LEVEL_BITS, DIAGONAL_BITS, LEVEL_MAGIC_NUMBERS, DIAGONAL_MAGIC_NUMBERS } from "./constant-gvar.js"
import { ArrayBigIntToString } from "./helper.js"
import Object_SizeOf from "object-sizeof"

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
	const used_attacks = new Array(4096)

	const attack_mask = diagonal ? diagonal_masks[square_index] : level_masks[square_index]
	const target_squares = diagonal ? diagonal_squares[square_index] : level_squares[square_index]
	const occupancy_indicies = 1 << bits

	for (let index = 0; index < occupancy_indicies; index++) {
		occupancies[index] = IndexToUBigInt64(index, occupancy_indicies, attack_mask)
		attacks[index] = MaskSlidingAttaks(occupancies[index], target_squares)
	}

	for (let _ = 0, fail = 0; _ < 100000000; _++) {
		const magic_number = GenerateMagicNumber()

		if (BigInt(new BitboardClass((attack_mask * magic_number) & 0xff00000000000000n).CountBits()) < 6) continue

		for (let index = 0, fail; !fail && index < occupancy_indicies; index++) {
			const magic_index = (occupancies[index] * magic_number) >> (64n - BigInt(bits))

			if (!used_attacks[magic_index]) {
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

function Generate64ArrayMagicNumbers(print_number, bits, diagonal) {
	const array_numbers = new Array(64)
	const start = Date.now()

	for (let index = 0; index < 64; index++) {
		const index_magic_number = FindMagicNumber(index, bits[index], diagonal)

		if (print_number) {
			console.log(`${index_magic_number}n,`)
		}

		array_numbers[index] = index_magic_number
	}

	console.log(`Generation took: ${(Date.now() - start) / 1000}s`)
	return array_numbers
}

function NotFoundSmallestValue(value, magic_numbers, index) {
	return value < magic_numbers[index] && magic_numbers.findIndex((_value) => value === _value) < 0
}

export function InitSmallestMagicNumberPossible(max_loop = 5) {
	const level_numbers = structuredClone(LEVEL_MAGIC_NUMBERS)
	const diagonal_numbers = structuredClone(DIAGONAL_MAGIC_NUMBERS)

	for (let i = 0; i < max_loop; i++) {
		const start = Date.now()
		const level = Generate64ArrayMagicNumbers(false, LEVEL_BITS, false)
		const diagonal = Generate64ArrayMagicNumbers(false, DIAGONAL_BITS, true)
		console.log(`Generation ${i + 1} complete: ${(Date.now() - start) / 1000}s\n`)

		for (let index = 0; index < 64; index++) {
			if (NotFoundSmallestValue(level[index], level_numbers, index)) {
				// console.log(`Smaller than ${level[index]}, ${level_numbers[index]}`)
				level_numbers[index] = level[index]
			}

			if (NotFoundSmallestValue(diagonal[index], diagonal_numbers, index)) {
				// console.log(`Smaller than ${diagonal[index]}, ${diagonal_numbers[index]}`)
				diagonal_numbers[index] = diagonal[index]
			}
		}
	}

	console.log("\nLevel magic numbers")
	level_numbers.forEach((magic) => {
		console.log(`${magic}n,`)
	})

	console.log("\nDiagonal magic numbers")
	diagonal_numbers.forEach((magic) => {
		console.log(`${magic}n,`)
	})

	return
}

export function InitMagicNumbers(show_numbers = false) {
	console.log("Level magic numbers")
	const level_numbers = Generate64ArrayMagicNumbers(show_numbers, LEVEL_BITS, false)

	console.log("\nDiagonal magic numbers")
	const diagonal_numbers = Generate64ArrayMagicNumbers(show_numbers, DIAGONAL_BITS, true)
	console.log(`Diagonal size: ${Object_SizeOf(ArrayBigIntToString(diagonal_numbers))}`)

	console.log("\nMagic number generation complete")
	console.log(`Level size: ${Object_SizeOf(ArrayBigIntToString(level_numbers))}`)
}
