module.exports = {
	devtool: "source-map",
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
		}, {
			test: /\.glsl?$/,
			loader: "raw-loader"
		}]
	}
};
