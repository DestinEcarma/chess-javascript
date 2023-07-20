//* Initialize magic number if need
// const{ InitMagicNumbers, InitHorizontalMagicNumbers } = require("./src/magic-attacks")
// InitMagicNumbers(true)
//// InitHorizontalMagicNumbers()

const prompt = require("prompt-sync")()
const { COMMANDS, RUNNER } = require("./src/commands")

while (RUNNER.value) {
	const cmd_prompt = (prompt() ?? "").split(" ")
	const command = COMMANDS[cmd_prompt.shift()]

	if (command) {
		command(cmd_prompt)
	} else console.log("Invalid command!")
}
