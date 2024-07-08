const path = require("path");

const webpack = require("webpack");

const HtmlWebpackPlugin = require("html-webpack-plugin");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

const TerserPlugin = require("terser-webpack-plugin");

const packageJson = require("./package.json");

module.exports = {
    //mode: "production",
    mode: "development",
    //devtool: "inline-source-map",
    entry: "./src/index.js",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "sql.editor.js",
        libraryTarget: "umd",
    },

    optimization: {
        minimize: true,
        minimizer: [
            new CssMinimizerPlugin(),
            new TerserPlugin({
                extractComments: false,
                terserOptions: {
                    format: {
                        comments: false,
                    },
                },
            }),
        ],
    },
    module: {
        rules: [
            {
                test: /\.(sa|sc|c)ss$/i,
                //exclude: /node_modules/u,
                use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
                //use: ["style-loader", "css-loader"],
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                type: "asset/resource",
            },
        ],
    },
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
    },
    plugins: [
        new HtmlWebpackPlugin({
            inject: true,
            template: "src/index.html",
        }),
        new MiniCssExtractPlugin({
            filename: "sql.editor.min.css",
        }),
        /*
        new ExtractTextPlugin({
            filename: "style.css",
        }),
        */
        new MonacoWebpackPlugin({
            filename: "[hash].worker.js",
            languages: ["sql", "javascript", "html", "json"],
            globalAPI: true,
        }),
        new webpack.DefinePlugin({
            APP_VERSION: JSON.stringify(packageJson.version), // 패키지 버전을 전역 변수로 설정합니다.
        }),
    ],
    devServer: {
        compress: true,
        port: 9000,
    },
};
