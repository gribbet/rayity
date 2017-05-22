module.exports = {
	entry: "./index.ts",
	output: {
		filename: "index.js"
	},
	resolve: {
		extensions: ["", ".ts"]
	},
	module: {
		loaders: [
			{test: /\.ts?$/, loader: "ts-loader"}
		]
	}
}
