const stock_fish = {
	e2e3: 25,
	g2g3: 25,
	a5a6: 25,
	e2e4: 24,
	g2g4: 24,
	f1a1: 25,
	f1b1: 25,
	f1c1: 25,
	f1d1: 25,
	f1e1: 25,
	f1g1: 25,
	f1h1: 25,
	f1f2: 25,
	f1f3: 24,
	f1f4: 7,
	a5a4: 25,
	a5b4: 25,
}

const mine = {
	a5a4: 25,
	a5b4: 25,
	a5a6: 25,
	e2e3: 25,
	g2g3: 25,
	e2e4: 25,
	g2g4: 25,
	f1a1: 25,
	f1b1: 25,
	f1c1: 25,
	f1d1: 25,
	f1e1: 25,
	f1g1: 25,
	f1h1: 25,
	f1f2: 25,
	f1f3: 24,
	f1f4: 7,
}

Object.entries(mine).forEach(([notation, nodes]) => {
	const my_nodes = stock_fish[notation]
	if (!my_nodes) return console.log(`${notation} is missing`)
	if (my_nodes === nodes) return

	console.log(`${notation} StockFish Nodes: ${nodes}, My Nodes: ${my_nodes}, Difference: ${nodes - my_nodes}`)
})
