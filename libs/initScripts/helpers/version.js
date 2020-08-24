/**
 *
 * @param {Object} audiusLibs fully formed audius libs instance with eth contracts connection
 * @param {String} serviceType service type trying to register
 * @param {String} serviceVersionStr version string to register
 * @param {String?} privateKey optional private key string
 */
async function setServiceVersion (audiusLibs, serviceType, serviceVersionStr, privateKey = null) {
  if (!audiusLibs) throw new Error('audiusLibs is not defined')

  console.log('----version init---')

  try {
    await audiusLibs.ethContracts.ServiceTypeManagerClient.setServiceVersion(
      serviceType,
      serviceVersionStr,
      privateKey)
  } catch (e) {
    if (!e.toString().includes('Already registered')) {
      console.log(e)
    } else {
      console.log('Already registered')
    }
  }

  let versionTx = await audiusLibs.ethContracts.ServiceTypeManagerClient.getCurrentVersion(serviceType)
  let numVersionsTx = await audiusLibs.ethContracts.ServiceTypeManagerClient.getNumberOfVersions(serviceType)
  console.log(`${serviceType} | current version: ${versionTx} | number of versions : ${numVersionsTx}`)

  console.log('/----version init---')
}

module.exports = { setServiceVersion }
