const Web3 = require('web3')

const initAudiusLibs = require('./initAudiusLibs')

const serviceTypeList = ['discovery-provider', 'creator-node', 'content-service']
const spDiscProvType = serviceTypeList[0]
const spCreatorNodeType = serviceTypeList[1]
const discProvEndpoint1 = 'http://docker.for.mac.localhost:5000'
const creatorNodeEndpoint1 = 'http://docker.for.mac.localhost:4000'
const creatorNodeEndpoint2 = 'http://docker.for.mac.localhost:4010'

function throwArgError () {
  throw new Error('missing argument - format: node examples/initiateStakingOperations.js [distribute, fundclaim, getclaim, stakeinfo, initversions, register-sps, query-sps, init-all]')
}
let testVersionStr = '0.1.0'

let args = process.argv
if (args.length < 3) {
  throwArgError()
}

async function run() {
  try{
    switch (args[2]) {
      case 'distribute':
        console.log('distribute')
        await distributeTokens()
        break
      case 'fundclaim':
        console.log('fundclaim')
        await fundNewClaim()
        break
      case 'getclaim':
        console.log('fundclaim')
        await getClaimInfo()
        break
      case 'stakeinfo':
        console.log('stakeinfo')
        await getStakingParameters()
        break
      case 'initversions':
        await initializeVersions()
        break
      case 'register-sps':
        await registerLocalServices()
        break
      case 'query-sps':
        await queryLocalServices()
        break
      case 'init-all':
        await initializeLocalEnvironment()
        break
      default:
        throwArgError()
    }
  
    process.exit(0)
  }
  catch(e){
    console.error(e)
    process.exit(1)
  }
}

run()

async function getStakingParameters () {
  const audius1 = await initAudiusLibs(true)
  let min = await audius1.ethContracts.StakingProxyClient.getMinStakeAmount()
  let max = await audius1.ethContracts.StakingProxyClient.getMaxStakeAmount()

  console.log(`Min: ${min}`)
  console.log(`Max: ${max}`)
}

async function getClaimInfo () {
  // @dev - audius instance numbering is off-by-1 from accounts to
  //  align with creator/track numbering below, which are 1-indexed
  const audius1 = await initAudiusLibs(true)
  console.log(await audius1.ethContracts.StakingProxyClient.getClaimInfo())
}

// NOTE: THis has only been tested with local configs
// Add new initialization logic for net
// fundNewClaim()

async function fundNewClaim () {
  // only used to get accounts
  const ethWeb3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8546/'))
  const ethAccounts = await ethWeb3.eth.getAccounts()
  console.log(ethAccounts)

  // @dev - audius instance numbering is off-by-1 from accounts to
  //  align with creator/track numbering below, which are 1-indexed
  const audius1 = await initAudiusLibs(true)

  // Set default claim to 1,000,000 tokens
  const claimAmountInAUDS = 1000000
  const libOwner = audius1.ethContracts.ethWeb3Manager.getWalletAddress()

  console.log('/---- Funding new claim')
  let bal = await audius1.ethContracts.AudiusTokenClient.balanceOf(libOwner)
  console.log(bal)
  let dataWeb3 = audius1.contracts.web3Manager.getWeb3()
  let claimAmountInAudWei = dataWeb3.utils.toWei(claimAmountInAUDS.toString(), 'ether')
  let claimAmountInAudWeiBN = dataWeb3.utils.toBN(claimAmountInAudWei)

  // Actually perform fund op
  await audius1.ethContracts.StakingProxyClient.fundNewClaim(claimAmountInAudWeiBN)
  console.log('/---- End funding new claim')

  await getClaimInfo()
  // console.dir(audius1.contracts)
}

async function distributeTokens () {
  const ethWeb3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8546/'))
  const ethAccounts = await ethWeb3.eth.getAccounts()
  console.log(ethAccounts)
  const audius1 = await initAudiusLibs(true)
  const amountOfAUDS = 100000
  let initialTokenInAudWei = ethWeb3.utils.toWei(amountOfAUDS.toString(), 'ether')
  let initialTokenInAudWeiBN = ethWeb3.utils.toBN(initialTokenInAudWei)
  for (const acct of ethAccounts) {
    if (acct === ethAccounts[0]) { continue }
    console.log(acct)
    let tx = await audius1.ethContracts.AudiusTokenClient.transfer(acct, initialTokenInAudWeiBN)
    console.log(tx)
  }
}

async function initializeVersions () {
  const audius1 = await initAudiusLibs(true)
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
}

async function registerLocalServices () {
  await distributeTokens()
  const testWeb3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8546/'))
  const audius1 = await initAudiusLibs(true)
  let ethweb3 = audius1.ethWeb3Manager.getWeb3()
  let ethAccts = await ethweb3.eth.getAccounts()
  console.log('\nregistering service providers/---')
  const amountOfAUDS = 100000
  let initialTokenInAudWei = testWeb3.utils.toWei(amountOfAUDS.toString(), 'ether')
  let initialTokenInAudWeiBN = testWeb3.utils.toBN(initialTokenInAudWei)
  try {
    // Register discovery provider
    console.log('\nregistering disc prov')
    let tx = await audius1.ethContracts.ServiceProviderFactoryClient.register(
      spDiscProvType,
      discProvEndpoint1,
      initialTokenInAudWeiBN)
    console.dir(tx, { depth: 5 })
  } catch (e) {
    if (!e.toString().includes('already registered')) {
      console.log(e)
    } else {
      console.log(`\n${discProvEndpoint1} already registered`)
    }
  }

  // Initialize w/different acct
  const audius2 = await initAudiusLibs(true, null, ethAccts[1])
  try {
    // Register creator node
    console.log('\nregistering creator node 1')
    let tx = await audius2.ethContracts.ServiceProviderFactoryClient.register(
      spCreatorNodeType,
      creatorNodeEndpoint1,
      initialTokenInAudWeiBN)
    console.dir(tx, { depth: 5 })
  } catch (e) {
    if (!e.toString().includes('already registered')) {
      console.log(e)
    } else {
      console.log(`\n${creatorNodeEndpoint1} already registered`)
    }
  }
}

async function queryLocalServices () {
  const ethWeb3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8546/'))
  const ethAccounts = await ethWeb3.eth.getAccounts()
  const audius1 = await initAudiusLibs(true)
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
        await audius1.ethContracts.ServiceProviderFactoryClient.getServiceProviderIdFromAddress(
          ethAccounts[0],
          type)
      console.log(`SP IDs from owner wallet ${ethAccounts[0]}: ${idsFromAddress}`)
    }
    let numProvs = await audius1.ethContracts.ServiceProviderFactoryClient.getTotalServiceTypeProviders(spType)
    console.log(`num ${spType}: ${numProvs}`)
  }
  console.log('----querying service providers done')
}

async function initializeLocalEnvironment () {
  await distributeTokens()
  await initializeVersions()
  await registerLocalServices()
  await queryLocalServices()
}
