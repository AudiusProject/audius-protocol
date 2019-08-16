const AudiusLibs = require('@audius/libs')
const config = require('./config.js')

const registryAddress = config.get('registryAddress')
const web3ProviderUrl = config.get('web3Provider')

let audiusInstance

async function setupAndRun () {
  const dataWeb3 = await AudiusLibs.Utils.configureWeb3(web3ProviderUrl, null, false)
  if (!dataWeb3) throw new Error('Web3 incorrectly configured')
  
  audiusInstance = new AudiusLibs({
    web3Config: {
      registryAddress,
      useExternalWeb3: true,
      externalWeb3Config: {
        web3: dataWeb3,
        // this is a stopgap since libs external web3 init requires an ownerWallet
        // this is never actually used in the service's libs calls
        ownerWallet: config.get('relayerPublicKey')
      }
    },
    isServer: true
  })
  
  return audiusInstance.init()
}

module.exports.audiusLibsInstance = audiusInstance
module.exports = setupAndRun
