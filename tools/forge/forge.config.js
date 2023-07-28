// Forge Configuration
const path = require('path');
const rootDir = process.cwd();

module.exports = {
    // Packager Config
    packagerConfig: {
        asar: true,
        executableName: 'Quick Switcher',
        appCopyright: 'Copyright (C) 2023 MysticEggs',
        icon: path.resolve(__dirname, 'assets/appIcon'),
        extraResource: ['assets/appIcon.ico', 'assets/mac/TrayIcon.png'],
    },
    makers: [
        {
            name: '@electron-forge/maker-dmg',
            config: {
                format: 'ULFO',
            },
        },
    ],
    plugins: [
        {
            name: '@electron-forge/plugin-webpack',
            config: {
                // Fix content-security-policy error when image or video src isn't same origin
                // Remove 'unsafe-eval' to get rid of console warning in development mode.
                devContentSecurityPolicy: `default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-inline' data:`,
                // Ports
                port: 3000, // Webpack Dev Server port
                loggerPort: 9000, // Logger port
                // Main process webpack configuration
                mainConfig: path.join(rootDir, 'tools/webpack/webpack.main.js'),
                // Renderer process webpack configuration
                renderer: {
                    // Configuration file path
                    config: path.join(
                        rootDir,
                        'tools/webpack/webpack.renderer.js'
                    ),
                    // Entrypoints of the application
                    entryPoints: [
                        {
                            // Window process name
                            name: 'app_window',
                            // React Hot Module Replacement (HMR)
                            rhmr: 'react-hot-loader/patch',
                            // HTML index file template
                            html: path.join(rootDir, 'src/renderer/index.html'),
                            // Renderer
                            js: path.join(rootDir, 'src/renderer/renderer.ts'),
                            // Main Window
                            // Preload
                            preload: {
                                js: path.join(
                                    rootDir,
                                    'src/renderer/preload.ts'
                                ),
                            },
                        },
                    ],
                },
                devServer: {
                    liveReload: false,
                },
            },
        },
    ],
};
