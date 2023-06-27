import { fileURLToPath } from "url"
import { dirname } from "path"

export function GetFilename(url) {
	return fileURLToPath(url)
}

export function GetDirname(url) {
	return dirname(GetFilename(url))
}
