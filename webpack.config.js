const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const webpack = require("webpack");
const fs = require("fs");

// Inline CSS + JS into a single html file (Figma UI requirement)
class InlineHtmlPlugin {
  apply(compiler) {
    compiler.hooks.emit.tap("InlineHtmlPlugin", (compilation) => {
      const htmlFile = compilation.assets["ui.html"];
      if (!htmlFile) return;

      let html = htmlFile.source();

      // Inline all script tags
      html = html.replace(
        /<script src="([^"]+)"><\/script>/g,
        (match, src) => {
          const asset = compilation.assets[src];
          if (asset) {
            delete compilation.assets[src];
            return `<script>${asset.source()}</script>`;
          }
          return match;
        }
      );

      // Inline all link/style tags
      html = html.replace(
        /<link rel="stylesheet" href="([^"]+)">/g,
        (match, href) => {
          const asset = compilation.assets[href];
          if (asset) {
            delete compilation.assets[href];
            return `<style>${asset.source()}</style>`;
          }
          return match;
        }
      );

      compilation.assets["ui.html"] = {
        source: () => html,
        size: () => html.length,
      };
    });
  }
}

module.exports = [
  // Plugin sandbox code (no DOM)
  {
    name: "code",
    entry: "./src/code.ts",
    target: "web",
    output: {
      filename: "code.js",
      path: path.resolve(__dirname, "dist"),
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
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
  // Plugin UI (React app)
  {
    name: "ui",
    entry: "./src/ui.tsx",
    target: "web",
    output: {
      filename: "ui.js",
      path: path.resolve(__dirname, "dist"),
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/ui.html",
        filename: "ui.html",
        inject: "body",
      }),
      new InlineHtmlPlugin(),
    ],
  },
];
