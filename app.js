//* Initialize magic number if need
// import { InitMagicNumbers, InitHorizontalMagicNumbers } from "./src/magic-attacks.js"
// InitMagicNumbers(true)
//// InitHorizontalMagicNumbers()

import ps from "prompt-sync"
import { COMMANDS, RUNNING } from "./src/commands.js"
const prompt = ps()

while (RUNNING) {
	const cmd_prompt = (prompt() ?? "").split(" ")
	const no_space = cmd_prompt.shift()
	const with_space = `${no_space} ${cmd_prompt.shift()}`

	if (COMMANDS[no_space]) {
		COMMANDS[no_space](cmd_prompt)
	} else if (COMMANDS[with_space]) {
		COMMANDS[with_space](cmd_prompt)
	} else console.log("Invalid command!")

	console.log()
}
