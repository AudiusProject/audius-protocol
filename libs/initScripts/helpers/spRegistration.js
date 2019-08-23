const { getEthWeb3AndAccounts, convertAudsToWeiBN } = require('./utils')

/**
 *
 * @param {Object} audiusLibs fully formed audius libs instance with eth contracts connection
 */
async function getStakingParameters (audiusLibs) {
  let min = await audiusLibs.ethContracts.StakingProxyClient.getMinStakeAmount()
  let max = await audiusLibs.ethContracts.StakingProxyClient.getMaxStakeAmount()
  console.log(`getStakingParameters: min: ${min}, max: ${max}`)
  return { min, max }
}

/**
 * Local only
 * @param {Object} audiusLibs fully formed audius libs instance with eth contracts connection
 * @param {String} serviceType service type trying to register
 * @param {String} serviceEndpoint url string of service to register
 */
async function registerLocalService (audiusLibs, serviceType, serviceEndpoint, amountOfAUDS) {
  if (!amountOfAUDS) throw new Error('registerLocalService requires an amountOfAuds property')

  const { ethWeb3 } = await getEthWeb3AndAccounts(audiusLibs)
  console.log('\nregistering service providers/---')
  let initialTokenInAudWeiBN = convertAudsToWeiBN(ethWeb3, amountOfAUDS)

  try {
    // Register service
    console.log(`\nregistering service ${serviceType} ${serviceEndpoint}`)
    let tx = await audiusLibs.ethContracts.ServiceProviderFactoryClient.register(
      serviceType,
      serviceEndpoint,
      initialTokenInAudWeiBN)
    console.dir(tx, { depth: 5 })
  } catch (e) {
    if (!e.toString().includes('already registered')) {
      console.log(e)
    } else {
      console.log(`\n${serviceEndpoint} already registered`)
    }
  }
}

/**
 * Local only
 * @param {Object} audiusLibs fully formed audius libs instance with eth contracts connection
 * @param {String} serviceType service type trying to register
 * @param {String} serviceEndpoint url string of service to register
 */
async function deregisterLocalService (audiusLibs, serviceType, serviceEndpoint) {
  try {
    // de-register service
    console.log(`\nde-registering service ${serviceType} ${serviceEndpoint}`)
    let tx = await audiusLibs.ethContracts.ServiceProviderFactoryClient.deregister(
      serviceType,
      serviceEndpoint)
    console.dir(tx, { depth: 5 })
  } catch (e) {
    console.log(e)
  }
}

/**
 * Local only
 * @param {Object} audiusLibs fully formed audius libs instance with eth contracts connection
 */
async function queryLocalServices (audiusLibs, serviceTypeList) {
  const { ethAccounts } = await getEthWeb3AndAccounts(audiusLibs)

  for (const spType of serviceTypeList) {
    console.log(`\n${spType}`)
    let spList = await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderList(spType)
    for (const sp of spList) {
      console.log(sp)
      const { spID, type, endpoint } = sp
      let idFromEndpoint =
        await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromEndpoint(endpoint)
      console.log(`ID from endpoint: ${idFromEndpoint}`)
      let infoFromId =
        await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderInfo(type, spID)
      let jsonInfoFromId = JSON.stringify(infoFromId)
      console.log(`Info from ID: ${jsonInfoFromId}`)
      let idsFromAddress =
        await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromAddress(
          ethAccounts[0],
          type)
      console.log(`SP IDs from owner wallet ${ethAccounts[0]}: ${idsFromAddress}`)
    }
    let numProvs = await audiusLibs.ethContracts.ServiceProviderFactoryClient.getTotalServiceTypeProviders(spType)
    console.log(`num ${spType}: ${numProvs}`)
  }
  console.log('----querying service providers done')
}

module.exports = { getStakingParameters, registerLocalService, deregisterLocalService, queryLocalServices }
