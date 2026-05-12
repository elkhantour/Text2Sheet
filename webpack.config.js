const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const path = require("path");

// ─── Webpack config ───────────────────────────────────────────────────────────

module.exports = (env, argv) => [
	{
		name: "code",
		entry: "./src/code.ts",
		target: "web",
		mode: argv.mode === 'production' ? 'production' : 'development',
		devtool: argv.mode === 'production' ? false : 'inline-source-map',
		output: {
			filename: "code.js",
			path: path.resolve(__dirname, "dist"),
			clean: true,
		},
		resolve: { extensions: [".ts", ".js"] },
		module: {
			rules: [
				{
					test: /\.ts$/,
					use: "ts-loader",
					exclude: /node_modules/,
				},
			],
		},
	},
	{
		name: "ui",
		entry: "./src/ui.tsx",
		target: "web",
		mode: argv.mode === 'production' ? 'production' : 'development',
		devtool: argv.mode === 'production' ? false : 'inline-source-map',
		output: {
			filename: "ui.js",
			path: path.resolve(__dirname, "dist"),
			publicPath: "",
		},
		resolve: { extensions: [".tsx", ".ts", ".js"] },
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					use: "ts-loader",
					exclude: /node_modules/,
				},
				{
					test: /\.s?css$/,
					use: ['style-loader', 'css-loader', 'sass-loader']
				},
			],
		},
		plugins: [
			new HtmlWebpackPlugin({
				template: "./src/ui.html",
				filename: "ui.html",
				inject: "body",
				cache: false //refresh html on watch
			}),
			new HtmlInlineScriptPlugin({ scriptMatchPattern: [/ui/] }),
		],
	},
];
