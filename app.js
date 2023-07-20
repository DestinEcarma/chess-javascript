//* Initialize magic number if need
// import { InitMagicNumbers, InitHorizontalMagicNumbers } from "./src/magic-attacks.js"
// InitMagicNumbers(true)
//// InitHorizontalMagicNumbers()

import ps from "prompt-sync"
import { COMMANDS, RUNNING } from "./src/commands.js"
const prompt = ps()

while (RUNNING) {
	const cmd_prompt = (prompt() ?? "").split(" ")
	const command = COMMANDS[cmd_prompt.shift()]

	if (command) {
		command(cmd_prompt)
	} else console.log("Invalid command!")

	console.log()
}
