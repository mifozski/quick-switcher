const path = require('path');
const rootDir = process.cwd();

module.exports = {
    packagerConfig: {
        asar: false,
        name: 'Quick Switcher',
        executableName: 'Quick Switcher',
        appCopyright: 'Copyright (C) 2023 MysticEggs',
        icon: path.join(process.cwd(), 'assets', 'AppIcon'),
        extraResource: [
            'assets/appIcon.ico',
            'assets/mac/TrayIcon.png',
            'assets/win/TrayIcon.ico',
        ],
    },
    makers: [
        {
            name: '@electron-forge/maker-dmg',
            config: {
                format: 'ULFO',
            },
        },
        {
            name: '@electron-forge/maker-squirrel',
            config: {
                setupIcon: path.join(process.cwd(), 'assets', 'AppIcon.ico'),
            },
        },
    ],
    plugins: [
        {
            name: '@electron-forge/plugin-webpack',
            config: {
                // Fix content-security-policy error when image or video src isn't same origin
                // Remove 'unsafe-eval' to get rid of console warning in development mode.
                devContentSecurityPolicy: `default-src 'self' 'unsafe-inline' data:; script-src 'self' 'unsafe-inline' data:; img-src 'self' http: https: 'unsafe-inline'; style-src http:`,
                // Ports
                port: 3000,
                loggerPort: 9000,
                mainConfig: path.join(rootDir, 'tools/webpack/webpack.main.js'),
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
                            html: path.join(
                                rootDir,
                                'src/renderer/assets/index.html'
                            ),
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
