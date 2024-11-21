module.exports = {
    apps: [
        {
            name: "test-server",
            script: "./build/index.js",
            watch: false,
            env: {
                NODE_ENV: "development",
            },
            env_production: {
                NODE_ENV: "production",
            }
        }
    ]
}