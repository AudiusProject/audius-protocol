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
    const to = entityManagerContractAddress
    const value = '0x00'
    const data = encodedABI
    const gasPrice = await web3.getGasPrice() // shouldn't need with ACDC

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
