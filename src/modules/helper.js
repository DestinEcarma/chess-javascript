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