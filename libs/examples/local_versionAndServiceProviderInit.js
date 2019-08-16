const Web3 = require('web3')

const initAudiusLibs = require('./initAudiusLibs')

const serviceTypeList = ['discovery-provider', 'creator-node', 'content-service']
const spDiscProvType = serviceTypeList[0]
const spCreatorNodeType = serviceTypeList[1]
const discProvEndpoint1 = 'http://docker.for.mac.localhost:5000'
const creatorNodeEndpoint1 = 'http://docker.for.mac.localhost:4000'
const creatorNodeEndpoint2 = 'http://docker.for.mac.localhost:4010'
const spEndpoint2 = 'http://localhost:5001'
let testVersionStr = '0.1.0'

registerVersionsAndServiceProviders()

async function registerVersionsAndServiceProviders () {
  // only used to get accounts
  const ethWeb3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8546/'))
  const ethAccounts = await ethWeb3.eth.getAccounts()
  console.log(ethAccounts)

  // @dev - audius instance numbering is off-by-1 from accounts to
  //  align with creator/track numbering below, which are 1-indexed
  const audius1 = await initAudiusLibs(true)

  // NOTE - This only works because the contract is deployed with the address from accounts[0]
  // In production, we must manually pass the private key associated with the account that deployed the contract
  console.log('/----version init---')
  let testTx = null
  for (const serviceType of serviceTypeList) {
    console.log(`\nregistering ${serviceType}`)
    try {
      testTx = await audius1.ethContracts.VersioningFactoryClient.setServiceVersion(
        serviceType,
        testVersionStr)
      console.log(testTx)
    } catch (e) {
      if (!e.toString().includes('Already registered')) {
        console.log(e)
      } else {
        console.log('Already registered')
      }
    }
  }

  for (const serviceType of serviceTypeList) {
    let versionTx = await audius1.ethContracts.VersioningFactoryClient.getCurrentVersion(serviceType)
    let numVersionsTx = await audius1.ethContracts.VersioningFactoryClient.getNumberOfVersions(serviceType)
    console.log(`${serviceType} | current version: ${versionTx} | number of versions : ${numVersionsTx}`)
  }

  console.log('----version init---/')
  return

  console.log('\nregistering service providers/---')
  try {
    // Register discovery provider
    console.log('\nregistering disc prov')
    let tx = await audius1.ethContracts.ServiceProviderFactoryClient.register(
      spDiscProvType,
      discProvEndpoint1)
    console.dir(tx, { depth: 5 })
  } catch (e) {
    if (!e.toString().includes('already registered')) {
      console.log(e)
    } else {
      console.log(`\n${discProvEndpoint1} already registered`)
    }
  }

  try {
    // Register creator node
    console.log('\nregistering creator node')
    let tx = await audius1.ethContracts.ServiceProviderFactoryClient.register(
      spCreatorNodeType,
      creatorNodeEndpoint1)
    console.dir(tx, { depth: 5 })
  } catch (e) {
    if (!e.toString().includes('already registered')) {
      console.log(e)
    } else {
      console.log(`\n${creatorNodeEndpoint1} already registered`)
    }
  }

  try {
    // Register creator node
    console.log('\nregistering creator node 2')
    let tx = await audius1.ethContracts.ServiceProviderFactoryClient.register(
      spCreatorNodeType,
      creatorNodeEndpoint2)
    console.dir(tx, { depth: 5 })
  } catch (e) {
    if (!e.toString().includes('already registered')) {
      console.log(e)
    } else {
      console.log(`\n${creatorNodeEndpoint2} already registered`)
    }
  }

  /*
  try {
    let tx = await audius1.ethContracts.ServiceProviderFactoryClient.deregister(
      spDiscProvType,
      discProvEndpoint1)
    console.dir(tx, { depth: 5 })
  } catch (e) {
    if (!e.toString().includes('already registered')) {
      console.log(e)
    } else {
      console.log(`\n${discProvEndpoint1} already registered`)
    }
  }
  */

  console.log('\n/---registering service providers')
  console.log('\n----querying service providers')
  for (const spType of serviceTypeList) {
    console.log(`\n${spType}`)
    let spList = await audius1.ethContracts.ServiceProviderFactoryClient.getServiceProviderList(spType)
    for (const sp of spList) {
      console.log(sp)
      let endpt = sp.endpoint
      let spID = sp.spID
      let type = sp.type
      let idFromEndpoint =
        await audius1.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromEndpoint(endpt)
      console.log(`ID from endpoint: ${idFromEndpoint}`)
      let infoFromId =
        await audius1.ethContracts.ServiceProviderFactoryClient.getServiceProviderInfo(type, spID)
      let jsonInfoFromId = JSON.stringify(infoFromId)
      console.log(`Info from ID: ${jsonInfoFromId}`)
      let idsFromAddress =
        await audius1.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdsFromAddress(
          ethAccounts[0],
          type)
      console.log(`SP IDs from owner wallet ${ethAccounts[0]}: ${idsFromAddress}`)
    }
    let numProvs = await audius1.ethContracts.ServiceProviderFactoryClient.getTotalServiceTypeProviders(spType)
    console.log(`num ${spType}: ${numProvs}`)
  }
  console.log('----querying service providers done')
  process.exit(0)
}
