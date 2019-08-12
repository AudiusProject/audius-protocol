const Web3 = require('web3')

const initAudiusLibs = require('./initAudiusLibs')

const serviceTypeList = ['discovery-provider', 'creator-node', 'content-service']
const spDiscProvType = serviceTypeList[0]
const spCreatorNodeType = serviceTypeList[1]
const discProvEndpoint1 = 'http://localhost:5000'
const creatorNodeEndpoint1 = 'http://localhost:4000'
const creatorNodeEndpoint2 = 'http://localhost:4010'
const spEndpoint2 = 'http://localhost:5001'

function throwArgError () {
  throw new Error('missing argument - format: node examples/initiateStakingOperations.js [distribute, fundclaim]')
}
let testVersionStr = '0.0.1'

let args = process.argv
if (args.length < 3) {
  throwArgError()
}

switch (args[2]) {
  case 'distribute':
    console.log('distribute')
    distributeTokens()
    break
  case 'fundclaim':
    console.log('fundclaim')
    fundNewClaim()
    break
  case 'getclaim':
    console.log('fundclaim')
    getClaimInfo()
    break
  default:
    throwArgError()
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
