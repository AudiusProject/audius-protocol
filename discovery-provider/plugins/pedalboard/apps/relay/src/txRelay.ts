import { App } from "basekit/src/index";
import { SharedData } from ".";
import { RelayRequestType } from "./types/relay";
import { Wallet, ethers } from "ethers";
import { TransactionReceipt, TransactionRequest } from "@ethersproject/abstract-provider"
import { validateSupportedContract, validateTransactionData } from "./validate";

export type RelayedTransaction = {
    receipt: TransactionReceipt,
    transaction: TransactionRequest
}

export const relayTransaction = async (app: App<SharedData>, req: RelayRequestType): Promise<RelayedTransaction> => {
    const { web3, wallets, config } = app.viewAppData()
    const { entityManagerContractAddress, entityManagerContractRegistryKey, defaultGasLimit } = config
    const { senderAddress, encodedABI } = req
    const gasLimit = req.gasLimit ?? defaultGasLimit

    // validate transaction and select wallet
    await validateTransactionData(encodedABI)
    const wallet = await wallets.selectNextWallet()

    const privateKey = "wallet.privateKey" // TODO: get private key from env var?
    const publicKey = "wallet.publicKey"
    const senderWallet = new Wallet(privateKey)
    const address = senderWallet.address
    if (address !== publicKey) throw new Error("Invalid relayerPublicKey")

    // gather some transaction params
    const nonce = await web3.getTransactionCount(address)
    // TODO: pull in from config
    const gasPrice = await getGasPrice(web3, { highGasPrice: 10000000, minGasPrice: 100, ganacheGasPrice: 0 })
    const to = entityManagerContractAddress
    const value = '0x00'
    const data = encodedABI

    // assemble, sign, and send transaction
    const transaction = { nonce, gasLimit, gasPrice, to, value, data }
    await senderWallet.signTransaction(transaction)
    const submit = await senderWallet.sendTransaction(transaction)

    // internally polls until mined, basically the same as client's confirmer
    const receipt = await submit.wait()

    // release wallet so next relay can use it
    wallets.release(wallet)

    return { receipt, transaction }
}

const getGasPrice = async (web3: ethers.providers.JsonRpcProvider, gasPrices: { highGasPrice: number, ganacheGasPrice: number, minGasPrice: number}): Promise<string> => {
  const { highGasPrice, minGasPrice, ganacheGasPrice } = gasPrices
  let gasPrice = (await web3.getGasPrice()).toNumber()
  if (isNaN(gasPrice) || gasPrice > highGasPrice) {
    console.log(
      'txRelay - gas price was not defined or was greater than HIGH_GAS_PRICE',
      gasPrice
    )
    gasPrice = ganacheGasPrice
  } else if (gasPrice === 0) {
    console.log('txRelay - gas price was zero', gasPrice)
    // If the gas is zero, the txn will likely never get mined.
    gasPrice = minGasPrice
  } else if (gasPrice < minGasPrice) {
    console.log('txRelay - gas price was less than MIN_GAS_PRICE', gasPrice)
    gasPrice = minGasPrice
  }
  return '0x' + gasPrice.toString(16)
}
