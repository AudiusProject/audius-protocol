const Web3 = require('web3')
const crypto = require('crypto')
const EthereumWallet = require('ethereumjs-wallet')
const EthereumTx = require('ethereumjs-tx').Transaction
const axios = require('axios')

// Switch to mainnet eth - ropsten is enabled by default to prevent accidental prod manipulation
// const ethWeb3ProviderEndpoint = 'https://ropsten.infura.io/v3/c569c6faf4f14d15a49d0044e7ddd668'
const ethWeb3ProviderEndpoint = 'https://mainnet.infura.io/v3/3a78237a7f4f42e69cf69cf9db7cecd6'
// const ethWeb3ProviderEndpoint = 'https://eth-mainnet.alchemyapi.io/v2/iSnek4T02BFCUEkcPGKo0eEY1aWLJgxF'

const fs = require('fs')

// 0.0001 ETH, 100000000000000 wei

// TBD: Actual target minimum for each relayer
// const minimumBalance = 100000000000000

// 0.1 eth =           100000000000000000 wei

// 0.25 eth =          250000000000000000
// const minimumBalance = 250000000000000000
// 0.075 eth
const minimumBalance = 75000000000000000

const ethWeb3 = new Web3(new Web3.providers.HttpProvider(ethWeb3ProviderEndpoint))

/*
Expected format of prod-relayer-config.json
{
    "funderPublicKey": "0x755f4...",
    "funderPrivateKey": "5d30...",
    "relayerWallets": [
      { "publicKey": "0x2c3...",
        "privateKey":
         "d77e00f6..." },
         ...]
    }
*/

/**
 * Make sure you save the `prod-relayer-config.json` file from LastPass to libs/initScripts
 */

const configFilePath = './prod-relayer-config.json'
if (!fs.existsSync(configFilePath)) {
  throw new Error('Please ensure you have prod-relayer-config.json saved locally and have set the path')
}

const prodRelayerInfo = require(configFilePath)

const generateNewAccounts = async () => {
  let numWallets = 1
  let wallets = []
  for (let i = 0; i < numWallets; i++) {
    const privateKey = crypto.randomBytes(32).toString('hex')
    const privateKeyBuffer = Buffer.from(privateKey, 'hex')
    const walletObj = EthereumWallet.fromPrivateKey(privateKeyBuffer)
    let info = {
      publicKey: walletObj.getAddressString(),
      privateKey
    }
    wallets.push(info)
  }
  console.log(wallets)
  await queryAccountBalances(wallets)
}

const queryAccountBalances = async (wallets) => {
  for (let i = 0; i < wallets.length; i++) {
    let pubKey = wallets[i].publicKey
    let balance = await ethWeb3.eth.getBalance(pubKey)
    console.log(`Found balance ${ethWeb3.utils.fromWei(balance)} eth (${balance} wei) for ${pubKey}`)
  }
  console.log(`\n\nQueried ${wallets.length} wallets`)
}

const queryRelayerBalances = async () => {
  let gasInfo = await getGasPrice()
  let walletInfo = await loadProdRelayerWallets()
  await queryAccountBalances(walletInfo.relayerWallets)
  console.log(gasInfo, '\n')
}

const loadProdRelayerWallets = async () => {
  let funder = {
    publicKey: prodRelayerInfo.funderPublicKey,
    privateKey: prodRelayerInfo.funderPrivateKey
  }
  // console.log(funder)
  let relayerWallets = prodRelayerInfo.relayerWallets
  // console.log(relayerWallets)
  let funderbalance = await ethWeb3.eth.getBalance(funder.publicKey)
  console.log(`\nFunder ${funder.publicKey} balance: ${ethWeb3.utils.fromWei(funderbalance)} eth (${funderbalance} wei)`)

  console.log(`Minimum relayer balance: ${ethWeb3.utils.fromWei(minimumBalance.toString())} eth (${minimumBalance.toString()} wei)\n\n`)

  return { funder, relayerWallets }
}

const getGasPrice = async () => {
  const { data } = await axios({
    url: 'https://identityservice.staging.audius.co/eth_gas_price',
    method: 'get',
    timeout: 3000
  })
  return data
}

const createAndSendTransaction = async (sender, receiverAddress, value, web3, gasPrice) => {
  const privateKeyBuffer = Buffer.from(sender.privateKey, 'hex')
  const walletAddress = EthereumWallet.fromPrivateKey(privateKeyBuffer)
  const address = walletAddress.getAddressString()
  //  "averageGweiHex": "0x1e08ffca00",
  // const gasPrice = "0x1e08ffca00"
  // fast price = 0x8d8f9fc00
  // new fast price = 0x2e90edd000
  // const gasPrice = "0x2e90edd000"
  // const gasPrice = "0x1e80355e00"
  // from identity - 0xf7100
  const gasLimit = '0xf7100'
  const nonce = await web3.eth.getTransactionCount(address)
  console.log(`Sending tx from ${sender.publicKey} to ${receiverAddress} with nonce=${nonce}, gasPrice=${gasPrice}, gasLimit=${gasLimit}`)
  let txParams = {
    nonce: web3.utils.toHex(nonce),
    gasPrice: gasPrice,
    gasLimit: gasLimit,
    to: receiverAddress,
    value: web3.utils.toHex(value)
  }
  const tx = new EthereumTx(txParams)
  tx.sign(privateKeyBuffer)
  const signedTx = '0x' + tx.serialize().toString('hex')
  try {
    await web3.eth.sendSignedTransaction(signedTx)
  } catch (e) {
    console.log(`Failed with ${e}`)
  }
}

const fundEthRelayerIfEmpty = async () => {
  let walletInfo = await loadProdRelayerWallets()

  let relayerWallets = walletInfo.relayerWallets

  let gasInfo
  let gasPrice

  for (let i = 0; i < relayerWallets.length; i++) {
    let relayerPublicKey = relayerWallets[i].publicKey
    let balance = await ethWeb3.eth.getBalance(relayerPublicKey)
    let validBalance = parseInt(balance) >= minimumBalance
    console.log(`${i + 1} - Found balance ${balance} for ${relayerPublicKey}, validBal=${validBalance}`)
    if (!validBalance) {
      let missingBalance = minimumBalance - balance
      console.log(`${i + 1} - Funding ${relayerPublicKey} with ${missingBalance}, currently ${balance}/${minimumBalance}`)
      gasInfo = await getGasPrice()
      gasPrice = gasInfo.fastestGweiHex
      await createAndSendTransaction(
        walletInfo.funder, // Always send from the designated FUNDER
        relayerPublicKey, // Public key of receiving account
        missingBalance, // Min
        ethWeb3,
        gasPrice
      )
      console.log(`${i + 1} - Finished Funding ${relayerPublicKey} with ${minimumBalance}`)
      balance = await ethWeb3.eth.getBalance(relayerPublicKey)
      console.log(`${i + 1} - Updated balance ${balance} for ${relayerPublicKey}`)
    }
  }
  await queryAccountBalances(relayerWallets)
}

let args = process.argv
const run = async () => {
  switch (args[2]) {
    case 'fundAllRelayers':
      await fundEthRelayerIfEmpty()
      break
    case 'queryRelayerBalances':
      await queryRelayerBalances()
      break
    case 'generatenewAccounts':
      await generateNewAccounts()
      break
    default:
      throw new Error('Invalid argument')
  }
}

run()
