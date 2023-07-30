const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const rules = require('./webpack.rules');
const plugins = require('./webpack.plugins');

console.log('__dirname', __dirname);
console.log('cwd()', process.cwd());
module.exports = {
    module: {
        rules,
    },
    target: 'electron-renderer',
    plugins: [
        ...plugins,
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(
                        process.cwd(),
                        'src',
                        'renderer',
                        'assets'
                    ),
                    to: path.resolve(
                        process.cwd(),
                        '.webpack/renderer',
                        'assets'
                    ),
                },
            ],
        }),
    ],
    resolve: {
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
        alias: {
            // Custom Aliases
            ...require('./webpack.aliases'),
        },
        fallback: {
            crypto: false,
            path: false,
        },
    },
    stats: 'minimal',
    /**
     * Fix: Enable inline-source-map to fix following:
     * Dev tools: unable to load source maps over custom protocol
     */
    devtool: 'inline-source-map',
};
