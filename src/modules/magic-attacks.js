import { BitboardClass } from "./bitboard.js"
import {
	level_masks,
	diagonal_masks,
	level_squares,
	diagonal_squares,
	GenerateMagicAttacks,
	diagonal_attacks,
} from "./pre-moves.js"
import { LEVEL_BITS, DIAGONAL_BITS, LEVEL_MAGIC_NUMBERS, DIAGONAL_MAGIC_NUMBERS } from "./constant-gvar.js"
import { GetMin, GetMax, GetMean, StopWatch, GetTotal, GetObjectSize } from "./helper.js"

const LEVEL_ATTACKS_AND_OCCUPANCIES = {
	attacks: new Array(64),
	occupancies: new Array(64),
}

const DIAGONAL_ATTACKS_AND_OCCUPANCIES = {
	attacks: new Array(64),
	occupancies: new Array(64),
}

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

	let result = new BitboardClass()

	for (let i = 0; i < bits; i++) {
		const square = bitboard_mask.PopLSB()

		if (index & (1 << i)) result.Or(1n << BigInt(square))
	}

	return result.Raw()
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

function GenerateAttacksAndOccupancies(square_index, bits, diagonal) {
	const attack_mask = diagonal ? diagonal_masks[square_index] : level_masks[square_index]
	const target_squares = diagonal ? diagonal_squares[square_index] : level_squares[square_index]
	const number_of_bits = 1 << bits

	const attacks = new Array(number_of_bits)
	const occupancies = new Array(number_of_bits)

	for (let index = 0; index < number_of_bits; index++) {
		attacks[index] = MaskSlidingAttaks(occupancies[index], target_squares)
		occupancies[index] = IndexToUBigInt64(index, number_of_bits, attack_mask)
	}

	return { attacks, occupancies }
}

function FindMagicNumber(square_index, bits, diagonal) {
	const attack_mask = diagonal ? diagonal_masks[square_index] : level_masks[square_index]
	const object = diagonal ? DIAGONAL_ATTACKS_AND_OCCUPANCIES : LEVEL_ATTACKS_AND_OCCUPANCIES
	const number_of_bits = 1 << bits

	const occupancies = object.occupancies[square_index]
	const attacks = object.attacks[square_index]
	const used_attacks = new Array()

	for (let _ = 0, fail = 0; _ < 100000000; _++) {
		const magic_number = GenerateMagicNumber()

		if (new BitboardClass((attack_mask * magic_number) & 0xff00000000000000n).CountBits() < 6) continue

		for (let index = 0, fail; !fail && index < number_of_bits; index++) {
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
	const stop_watch = StopWatch()

	for (let index = 0; index < 64; index++) {
		const index_magic_number = FindMagicNumber(index, bits[index], diagonal)

		if (print_number) {
			console.log(`${index_magic_number}n,`)
		}

		array_numbers[index] = index_magic_number
	}

	// console.log(`Generation took: ${stop_watch()}s`)
	return [array_numbers, stop_watch()]
}

function NotFoundSmallestValue(value, magic_numbers, index) {
	return value < magic_numbers[index] && magic_numbers.findIndex((_value) => value === _value) < 0
}

function InitSliderAttacksAndOccupancies() {
	for (let square_index = 0; square_index < 64; square_index++) {
		const _level = GenerateAttacksAndOccupancies(square_index, LEVEL_BITS[square_index], false)
		LEVEL_ATTACKS_AND_OCCUPANCIES.attacks[square_index] = _level.attacks
		LEVEL_ATTACKS_AND_OCCUPANCIES.occupancies[square_index] = _level.occupancies

		const _diagonal = GenerateAttacksAndOccupancies(square_index, DIAGONAL_BITS[square_index], true)
		DIAGONAL_ATTACKS_AND_OCCUPANCIES.attacks[square_index] = _diagonal.attacks
		DIAGONAL_ATTACKS_AND_OCCUPANCIES.occupancies[square_index] = _diagonal.occupancies
	}
}

export function InitSmallestMagicNumberPossible(max_loop = 5) {
	InitSliderAttacksAndOccupancies()

	const level_time = new Array(max_loop)
	const diagonal_time = new Array(max_loop)
	const generation_time = new Array(max_loop)

	let level_numbers = structuredClone(LEVEL_MAGIC_NUMBERS)
	let diagonal_numbers = structuredClone(DIAGONAL_MAGIC_NUMBERS)

	const attacks = GenerateMagicAttacks(level_numbers, diagonal_numbers)
	let level_size = GetObjectSize(attacks.level)
	let diagonal_size = GetObjectSize(attacks.diagonal)

	for (let i = 0; i < max_loop; i++) {
		const stop_watch = StopWatch()
		const level = Generate64ArrayMagicNumbers(false, LEVEL_BITS, false)
		const diagonal = Generate64ArrayMagicNumbers(false, DIAGONAL_BITS, true)
		generation_time[i] = stop_watch()

		const _attacks = GenerateMagicAttacks(level[0], diagonal[0])
		const _level_size = GetObjectSize(_attacks.level)
		const _diagonal_size = GetObjectSize(_attacks.diagonal)

		if (_level_size < level_size) {
			level_numbers = level[0]
			level_size = _level_size

			console.log(`Level size: ${(_level_size / 1024).toFixed(2)}`)
		}

		if (_diagonal_size < diagonal_size) {
			diagonal_numbers = diagonal[0]
			diagonal_size = _diagonal_size

			console.log(`Diagonal size: ${(_diagonal_size / 1024).toFixed(2)}`)
		}

		level_time[i] = level[1]
		diagonal_time[i] = diagonal[1]
	}

	console.log(`\nGeneartion complete in: ${GetTotal(generation_time).toFixed(3)}s`)
	console.log(`Minimum: ${GetMin(generation_time).toFixed(3)}s`)
	console.log(`Maximum: ${GetMax(generation_time).toFixed(3)}s`)
	console.log(`Mean: ${GetMean(generation_time).toFixed(3)}s`)

	console.log(`\nLevel Mean: ${GetMean(level_time).toFixed(3)}s`)
	console.log(`Diagonal Mean: ${GetMean(diagonal_time).toFixed(3)}s`)

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
	InitSliderAttacksAndOccupancies()

	console.log("Level magic numbers")
	const level_numbers = Generate64ArrayMagicNumbers(show_numbers, LEVEL_BITS, false)[0]

	console.log("\nDiagonal magic numbers")
	const diagonal_numbers = Generate64ArrayMagicNumbers(show_numbers, DIAGONAL_BITS, true)[0]

	const attacks = GenerateMagicAttacks(level_numbers, diagonal_numbers)

	console.log(`\nLevel size: ${(GetObjectSize(attacks.level) / 1024).toFixed(2)}kb`)
	console.log(`Diagonal size: ${(GetObjectSize(attacks.diagonal) / 1024).toFixed(2)}kb`)
	console.log("\nMagic number generation complete")
}
