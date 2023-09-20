const web3 = require('web3')

/**
 *
 * @param {Object} audiusLibs fully formed audius libs instance with eth contracts connection
 * @param {String} serviceType service type trying to register
 * @param {String} serviceVersionStr version string to register
 * @param {String?} privateKey optional private key string
 * @param {Boolean?} dryRun Optional parameter to return the generated parameters without sending tx
 */
async function setServiceVersion (audiusLibs, serviceType, serviceVersionStr, privateKey = null, dryRun = false) {
  if (!audiusLibs) throw new Error('audiusLibs is not defined')

  const validServiceTypes = ['discovery-node', 'content-node']
  if (!validServiceTypes.includes(serviceType)) {
    throw new Error(`Invalid serviceType: ${serviceType}, must be in ${validServiceTypes}`)
  }

  console.log('----version init---')
  let resp
  try {
    resp = await audiusLibs.ethContracts.ServiceTypeManagerClient.setServiceVersion(
      serviceType,
      serviceVersionStr,
      privateKey,
      dryRun
    )
  } catch (e) {
    if (!e.toString().includes('Already registered')) {
      console.log(e)
      return
    } else {
      console.log('Already registered')
    }
  }

  // this prints out the fields and values to be submitted onto the Governance dashboard
  // to create new proposals
  if (dryRun) {
    console.log(`
      Set latest ${serviceType} version on chain to v${serviceVersionStr}
      ServiceTypeManagerProxy
      setServiceVersion(bytes32,bytes32)
      ${resp}

      Description:
      Git SHA - <SHA>
      Link to release - <URL>
    `)
  }

  const versionTx = await audiusLibs.ethContracts.ServiceTypeManagerClient.getCurrentVersion(serviceType)
  const numVersionsTx = await audiusLibs.ethContracts.ServiceTypeManagerClient.getNumberOfVersions(serviceType)
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
  const weiMin = web3.utils.toWei(serviceTypeMin.toString(), 'ether')
  const weiMax = web3.utils.toWei(serviceTypeMax.toString(), 'ether')

  try {
    const resp = await audiusLibs.ethContracts.ServiceTypeManagerClient.addServiceType(
      serviceType,
      weiMin,
      weiMax,
      privateKey)
    console.log(resp)
  } catch (e) {
    console.error('Could not add new service type', e)
  }

  const serviceTypeInfo = await audiusLibs.ethContracts.ServiceTypeManagerClient.getServiceTypeInfo(serviceType)
  console.log(`Expected values for ${serviceType} | expected min ${weiMin} | expected max ${weiMax}`)
  console.log(`Values from contract: ${JSON.stringify(serviceTypeInfo)}`)
  console.log(`Min: ${serviceTypeInfo.minStake.toString()} Max: ${serviceTypeInfo.maxStake.toString()}`)

  console.log('/----addServiceType---')
}

module.exports = { setServiceVersion, addServiceType }
