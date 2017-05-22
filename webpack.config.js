module.exports = {
	entry: "./index.ts",
	output: {
		filename: "index.js"
	},
	resolve: {
		extensions: [".ts", ".js"]
	},
	module: {
		rules: [{
			test: /\.ts?$/,
			loader: "ts-loader"
		}]
	}
};
