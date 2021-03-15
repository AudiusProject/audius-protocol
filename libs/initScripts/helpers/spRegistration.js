const { getEthWeb3AndAccounts, convertAudsToWeiBN } = require('./utils')

/**
 *
 * @param {Object} audiusLibs fully formed audius libs instance with eth contracts connection
 */
async function getStakingParameters (audiusLibs) {
  if (!audiusLibs) throw new Error('audiusLibs is not defined')

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
 * @param {String} amountOfAUDS integer amount of auds tokens
 */
async function registerLocalService (audiusLibs, serviceType, serviceEndpoint, amountOfAUDS) {
  if (!audiusLibs) throw new Error('audiusLibs is not defined')
  if (!amountOfAUDS) throw new Error('registerLocalService requires an amountOfAuds property')

  const { ethWeb3 } = await getEthWeb3AndAccounts(audiusLibs)
  console.log('\nregistering service providers/---')
  let initialTokenInAudWeiBN = convertAudsToWeiBN(ethWeb3, amountOfAUDS)

  try {
    // Register service
    console.log(`registering service ${serviceType} ${serviceEndpoint}`)
    let tx = await audiusLibs.ethContracts.ServiceProviderFactoryClient.register(
      serviceType,
      serviceEndpoint,
      initialTokenInAudWeiBN)
    console.log(`registered service ${serviceType} ${serviceEndpoint} - ${tx.txReceipt.transactionHash}`)
  } catch (e) {
    if (!e.toString().includes('already registered')) {
      console.log(e)
    } else {
      console.log(`\n${serviceEndpoint} already registered`)
    }
  }
}

async function updateServiceDelegateOwnerWallet (audiusLibs, serviceType, serviceEndpoint, updatedDelegateOwnerWallet) {
  if (!audiusLibs || !serviceType || !serviceEndpoint || !updatedDelegateOwnerWallet) {
    throw new Error('Missing required params')
  }

  try {
    console.log(`Updating delegateOwnerWallet for ${serviceType} ${serviceEndpoint} with new wallet ${updatedDelegateOwnerWallet}`)
    const tx = await audiusLibs.ethContracts.ServiceProviderFactoryClient.updateDelegateOwnerWallet(
      serviceType, serviceEndpoint, updatedDelegateOwnerWallet
    )
    console.log(`Successfully updated delegateOwnerWallet for ${serviceType} ${serviceEndpoint} with new wallet ${updatedDelegateOwnerWallet} - ${JSON.stringify(tx, null, 2)}`)
  } catch (e) {
    throw new Error(`Failed to update delegateOwnerWallet for ${serviceType} ${serviceEndpoint} with new wallet ${updatedDelegateOwnerWallet} || ERROR ${e}`)
  }
}

/**
 * Local only
 * @param {Object} audiusLibs fully formed audius libs instance with eth contracts connection
 * @param {String} serviceType service type trying to register
 * @param {String} serviceEndpoint url string of service to register
 */
async function deregisterLocalService (audiusLibs, serviceType, serviceEndpoint) {
  if (!audiusLibs) throw new Error('audiusLibs is not defined')

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
 * @param {Array} serviceTypeList List of services to query
 * @param {Boolean} queryUserReplicaSetManager Conditionally query L2 replica set contract
 */
async function queryLocalServices (audiusLibs, serviceTypeList, queryUserReplicaSetManager = false) {
  if (!audiusLibs) throw new Error('audiusLibs is not defined')

  console.log('\n----querying service providers')
  const { ethAccounts } = await getEthWeb3AndAccounts(audiusLibs)
  let cnodesInfoList = null

  for (const spType of serviceTypeList) {
    console.log(`${spType}`)
    let spList = await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderList(spType)
    if (spType === 'content-node') {
      cnodesInfoList = spList
    }
    for (const sp of spList) {
      console.log(sp)
      const { spID, type, endpoint } = sp
      let idFromEndpoint =
        await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromEndpoint(endpoint)
      console.log(`ID from endpoint: ${idFromEndpoint}`)
      let infoFromId =
        await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceEndpointInfo(type, spID)
      let jsonInfoFromId = JSON.stringify(infoFromId)
      console.log(`Info from ID: ${jsonInfoFromId}`)
      let idsFromAddress =
        await audiusLibs.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdsFromAddress(
          ethAccounts[0],
          type)
      console.log(`SP IDs from owner wallet ${ethAccounts[0]}: ${idsFromAddress}`)
    }

    let numProvs = await audiusLibs.ethContracts.ServiceProviderFactoryClient.getTotalServiceTypeProviders(spType)
    console.log(`${numProvs} instances of ${spType}`)
  }
  console.log('----done querying service providers')
  if (queryUserReplicaSetManager) {
    console.log('\n----querying UserReplicaSetManager on data-contracts')
    for (const cnode of cnodesInfoList) {
      let spInfoFromUrsm = await audiusLibs.contracts.UserReplicaSetManagerClient.getContentNodeWallets(cnode.spID)
      let delegateWalletFromUrsmContract = spInfoFromUrsm.delegateOwnerWallet
      let ownerWalletFromUrsmContract = spInfoFromUrsm.ownerWallet
      console.log(`spID ${cnode.spID} | \
eth-contracts delegateWallet=${cnode.delegateOwnerWallet}, data-contracts delegateOwnerWallet=${delegateWalletFromUrsmContract}, ownerWallet=${ownerWalletFromUrsmContract}`)
    }
    console.log('----done querying UserReplicaSetManager on data-contracts\n')
  }
}

module.exports = { getStakingParameters, registerLocalService, deregisterLocalService, queryLocalServices, updateServiceDelegateOwnerWallet }
