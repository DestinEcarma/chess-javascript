import { fileURLToPath } from "url"
import { dirname } from "path"

export function GetFilename(url) {
	return fileURLToPath(url)
}

export function GetDirname(url) {
	return dirname(GetFilename(url))
}

export function ArrayBigIntToString(array) {
	return array.map((big_int) => {
		return String(big_int)
	})
}

export function ArrayStringToBigInt(array) {
	return array.map((string) => {
		return BigInt(string)
	})
}

export function StopWatch() {
	const start = Date.now()

	return function () {
		return (Date.now() - start) / 1000
	}
}

export function GetMean(numbers) {
	return GetTotal(numbers) / numbers.length
}

export function GetMax(numbers) {
	return Math.max(...numbers)
}

export function GetMin(numbers) {
	return Math.min(...numbers)
}

export function GetTotal(numbers) {
	return numbers.reduce((sum, value) => sum + value)
}

export function GetObjectSize(
	object,
	replacer = (_, value) => (typeof value === "bigint" ? value.toString() + "n" : value)
) {
	return JSON.stringify(object, replacer).length
}
