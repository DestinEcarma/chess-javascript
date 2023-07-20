const { fileURLToPath } = require("url")
const { dirname } = require("path")

function GetFilename(url) {
	return fileURLToPath(url)
}

function GetDirname(url) {
	return dirname(GetFilename(url))
}

function ArrayBigIntToString(array) {
	return array.map((big_int) => {
		return String(big_int)
	})
}

function ArrayStringToBigInt(array) {
	return array.map((string) => {
		return BigInt(string)
	})
}

function StopWatch() {
	const start = Date.now()

	return function () {
		return (Date.now() - start) / 1000
	}
}

function GetMean(numbers) {
	return GetTotal(numbers) / numbers.length
}

function GetMax(numbers) {
	return Math.max(...numbers)
}

function GetMin(numbers) {
	return Math.min(...numbers)
}

function GetTotal(numbers) {
	return numbers.reduce((sum, value) => sum + value)
}

function GetObjectSize(
	object,
	replacer = (_, value) => (typeof value === "bigint" ? value.toString() + "n" : value)
) {
	return JSON.stringify(object, replacer).length
}

module.exports = {
	GetFilename,
	GetDirname,
	ArrayBigIntToString,
	ArrayStringToBigInt,
	StopWatch,
	GetMean,
	GetMax,
	GetMin,
	GetTotal,
	GetObjectSize,
}
