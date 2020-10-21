const Web3 = require('web3')
const crypto = require("crypto");
const EthereumWallet = require('ethereumjs-wallet')
const EthereumTx = require('ethereumjs-tx')

// Switch to mainnet eth
const ethWeb3ProviderEndpoint = 'https://ropsten.infura.io/v3/c569c6faf4f14d15a49d0044e7ddd668'

const fs = require('fs')
const readline = require('readline')

// Length of eth relayer array
const ModNumber = 51

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

const prodRelayerInfo = require('./prod-relayer-config.json')

const generateNewAccounts = async () => {
    let numWallets = 1
    let wallets = []
    for (let i = 0; i < numWallets; i++) {
        const privateKey = crypto.randomBytes(32).toString("hex");
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
        console.log(`Found balance ${balance} for ${pubKey}`)
    }
}

const queryRelayerBalances = async () => {
    let walletInfo = await loadProdRelayerWallets()
    await queryAccountBalances(walletInfo.relayerWallets)
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
    console.log(`Funder balance: ${funderbalance.toString()}`)

    return { funder, relayerWallets }
}

const createAndSendTransaction = async (sender, receiverAddress, value, web3) => {
    const privateKeyBuffer = Buffer.from(sender.privateKey, 'hex')
    const walletAddress = EthereumWallet.fromPrivateKey(privateKeyBuffer)
    const address = walletAddress.getAddressString()
    //  "averageGweiHex": "0x1e08ffca00",
    const gasPrice = "0x1e08ffca00"
    // from identity - 0xf7100
    const gasLimit = "0xf7100"
    const nonce = await web3.eth.getTransactionCount(address)
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
    const receipt = await web3.eth.sendSignedTransaction(signedTx)
}

const fundEthRelayerIfEmpty = async () => {
    let walletInfo = await loadProdRelayerWallets()
    let funderbalance = await ethWeb3.eth.getBalance(walletInfo.funder.publicKey)
    console.log(`Funder balance: ${funderbalance.toString()}`)
    let relayerWallets = walletInfo.relayerWallets
    // 0.0001 ETH, 100000000000000 wei
    // TBD: Actual target minimum for each relayer
    const minimumBalance = 100000000000000
    for (let i = 0; i < relayerWallets.length; i++) {
        let relayerPublicKey = relayerWallets[i].publicKey
        let balance = await ethWeb3.eth.getBalance(relayerPublicKey)
        let validBalance = parseInt(balance) >= minimumBalance
        console.log(`${i + 1} - Found balance ${balance} for ${relayerPublicKey}, validBal=${validBalance}`)
        if (!validBalance) {
            console.log(`${i + 1} - Funding ${relayerPublicKey} with ${minimumBalance}`)
            await createAndSendTransaction(
                walletInfo.funder, // Always send from the designated FUNDER
                relayerPublicKey,             // Public key of receiving account
                minimumBalance,     // Min
                ethWeb3
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
            throw new Error("Invalid argument")
    }
}

run()

/*
const calculateProdRelayDistribution = async () => {
    const fileStream = fs.createReadStream('prod-wallets.txt')
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })

    let numLines = 0
    let maxLines = 100000
    // { calculatedIndex: NumHits }
    let indexCounts = {}

    let output = []

    for await (const line of rl) {
        let parsedInt = parseInt(line, 16)
        let calculatedIndex = parsedInt % ModNumber

        output.push(`${line} - int=${parsedInt}, index=${calculatedIndex}`)
        if(!indexCounts[calculatedIndex]) indexCounts[calculatedIndex] = 0

        indexCounts[calculatedIndex] += 1

        numLines+=1

        if (numLines >= maxLines) {
            break
        }
    }
    console.dir(indexCounts)
    fs.writeFileSync(`${Date.now()}_output.txt`, output.join('\n'))
}
*/