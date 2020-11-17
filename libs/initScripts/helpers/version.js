const web3 = require('web3')

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
    const resp = await audiusLibs.ethContracts.ServiceTypeManagerClient.setServiceVersion(
      serviceType,
      serviceVersionStr,
      privateKey)
    console.log(resp)
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

/**
 * Add a new service type on chain
 * @param {Object} audiusLibs fully formed audius libs instance with eth contracts connection
 * @param {String} serviceType service type trying to register
 * @param {String} serviceTypeMin minimum stake for serviceType
 * @param {String} serviceTypeMax maximum stake for serviceType
 * @param {String?} privateKey optional private key string
 */
async function addServiceType (audiusLibs, serviceType, serviceTypeMin, serviceTypeMax, privateKey = null) {
  if (!audiusLibs) throw new Error('audiusLibs is not defined')

  console.log('----addServiceType---')

  try {
    const resp = await audiusLibs.ethContracts.ServiceTypeManagerClient.addServiceType(
      serviceType,
      web3.utils.toWei(serviceTypeMin.toString(), 'ether'),
      web3.utils.toWei(serviceTypeMax.toString(), 'ether'),
      privateKey)
    console.log(resp)
  } catch (e) {
    console.error('Could not add new service type', e)
  }

  let serviceTypeInfo = await audiusLibs.ethContracts.ServiceTypeManagerClient.getServiceTypeInfo(serviceType)
  console.log(`Expected values for ${serviceType} | expected min ${serviceTypeMin} | expected max ${serviceTypeMax}`)
  console.log(`got values from contract: ${JSON.stringify(serviceTypeInfo)}`)

  console.log('/----addServiceType---')
}

module.exports = { setServiceVersion, addServiceType }
