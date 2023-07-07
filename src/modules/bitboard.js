export class BitboardClass {
	constructor(bitboard) {
		this._bitboard = BigInt(bitboard ?? 0)
	}

	Raw() {
		return this._bitboard
	}

	Set(square_index) {
		return this.Or(1n << BigInt(square_index))
	}

	Clear(square_index) {
		return this.And(~(1n << BigInt(square_index)))
	}

	Occupied(square_index) {
		return (this._bitboard & (1n << BigInt(square_index))) !== 0n
	}

	LeftShift(num) {
		this._bitboard <<= num
		return this
	}

	RightShift(num) {
		this._bitboard >>= num
		return this
	}

	XOr(num) {
		this._bitboard ^= num
		return this
	}

	Or(num) {
		this._bitboard |= num
		return this
	}

	And(num) {
		this._bitboard &= num
		return this
	}

	GetBitIndicies() {
		const bitboard_copy = new BitboardClass(this._bitboard)
		const indicies = []

		while (bitboard_copy.Raw()) {
			indicies.push(bitboard_copy.PopLSB())
		}

		return indicies
	}

	PopLSB() {
		if (this._bitboard === 0n) return -1n

		const lsb = this._bitboard & -this._bitboard
		const lsb_index = this.GetLSBIndex(lsb)
		this.XOr(lsb)

		return lsb_index
	}

	GetLSBIndex(lsb) {
		return Math.log2(Number(lsb))
	}

	CountBits(bitboard) {
		let bitboard_copy = bitboard ? bitboard : this._bitboard
		let counter = 0

		for (counter; bitboard_copy; counter++) {
			bitboard_copy &= bitboard_copy - 1n
		}

		return counter
	}

	PrintBitboard() {
		let bitboard_string = ""

		for (let rank = 7; rank >= 0; rank--) {
			for (let file = 0; file < 8; file++) {
				bitboard_string += ` ${this.Occupied(rank * 8 + file) ? 1 : 0} `
			}

			bitboard_string += "\n"
		}

		console.log(bitboard_string)
		console.log(`Bitboard: ${this._bitboard}n\n`)
	}
}
