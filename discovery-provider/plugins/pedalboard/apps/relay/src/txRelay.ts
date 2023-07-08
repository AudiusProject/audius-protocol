import { App } from "basekit/src/index";
import { SharedData } from ".";
import { RelayRequestType } from "./types/relay";
import { Wallet } from "ethers";
import { TransactionReceipt, TransactionRequest } from "@ethersproject/abstract-provider"

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
    await isInvalidTransaction(encodedABI)
    const wallet = await wallets.selectNextWallet()

    const privateKey = "wallet.privateKey" // TODO: get private key from env var?
    const publicKey = "wallet.publicKey"
    const senderWallet = new Wallet(privateKey)
    const address = senderWallet.address
    if (address !== publicKey) throw new Error("Invalid relayerPublicKey")

    // gather some transaction params
    const nonce = await web3.getTransactionCount(address)
    const gasPrice = await getGasPrice()
    const to = entityManagerContractAddress
    const value = '0x00'
    const data = encodedABI

    // assemble, sign, and send transaction
    const transaction = { nonce, gasLimit, gasPrice, to, value, data }
    await senderWallet.signTransaction(transaction)
    const submit = await senderWallet.sendTransaction(transaction)
    const receipt = await submit.wait() // internally polls until mined

    // release wallet so next relay can use it
    wallets.release(wallet)

    return { receipt, transaction }
}

/// async in case we need to make a db call
const isInvalidTransaction = async (encodedABI: string): Promise<boolean> => {
    // TODO: decode and validate against zod params
    // TODO: maybe check transactions table? this is no longer possible with the way identity works
    // TODO: filter replica set updates
    // if (failed) throw new Error("validation failed")
    return true
}

// TODO: https://github.com/AudiusProject/audius-protocol/blob/main/identity-service/src/relay/txRelay.js#L44
const getGasPrice = async (): Promise<number> => {
    return 10
}
