const convict = require('convict')

const config = convict({
  ipfsHost: {
    doc: 'IPFS host address',
    format: String,
    env: 'ipfsHost',
    default: 'docker.for.mac.localhost'
  },
  ipfsPort: {
    doc: 'IPFS port',
    format: 'port',
    env: 'ipfsPort',
    default: 6001
  }
})

config.validate()

module.exports = config
