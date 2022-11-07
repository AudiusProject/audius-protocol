module.exports = {
  apps: [
    {
      name: 'es-indexer',
      script: './build/src/main.js',
      restart_delay: 3000,
    },
    {
      name: 'graphql-server',
      script: './build/gqlapi/server.js',
      restart_delay: 3000,
    },
  ],
}
