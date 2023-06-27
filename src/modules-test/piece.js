export const piece = {
	WHITE: 1,
	BLACK: 2,
	EMPTY: 0,

	KING: 1,
	PAWN: 2,
	KNIGHT: 3,
	BISHOP: 5,
	ROOK: 6,
	QUEEN: 7,
}

export const piece_type_symbol = {
	k: "KING",
	p: "PAWN",
	n: "KNIGHT",
	b: "BISHOP",
	r: "ROOK",
	q: "QUEEN",
}

export const caslte = {
	K: 1,
	Q: 2,
	k: 4,
	q: 8,
}

export const piece_type_bytes = ["·", "k", "p", "n", "-", "b", "r", "q"]

// export const piece_type_bytes = {
// 	[piece.WHITE | piece.KING]: "K",
// 	[piece.WHITE | piece.PAWN]: "P",
// 	[piece.WHITE | piece.KNIGHT]: "N",
// 	[piece.WHITE | piece.BISHOP]: "B",
// 	[piece.WHITE | piece.ROOK]: "R",
// 	[piece.WHITE | piece.QUEEN]: "Q",

// 	[piece.BLACK | piece.KING]: "k",
// 	[piece.BLACK | piece.PAWN]: "p",
// 	[piece.BLACK | piece.KNIGHT]: "n",
// 	[piece.BLACK | piece.BISHOP]: "b",
// 	[piece.BLACK | piece.ROOK]: "r",
// 	[piece.BLACK | piece.QUEEN]: "q",
// }
