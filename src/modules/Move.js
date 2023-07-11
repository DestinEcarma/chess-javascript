import { MOVE_INFO } from "./constant-gvar.js"

export class Move {
	constructor(square_index, target_index, info) {
		this.square_index = square_index
		this.target_index = target_index
		this.info = info

		this._id = square_index | target_index
	}
}