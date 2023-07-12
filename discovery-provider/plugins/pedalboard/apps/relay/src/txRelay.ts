import { App } from "basekit/src/index";
import { SharedData } from ".";
import { RelayRequestType } from "./types/relay";
import { Wallet } from "ethers";
import { TransactionReceipt, TransactionRequest } from "@ethersproject/abstract-provider"
import { validateSupportedContract, validateTransactionData } from "./validate";
import { logger } from "./logger";
import { v4 as uuidv4 } from 'uuid'

export type RelayedTransaction = {
    receipt: TransactionReceipt,
    transaction: TransactionRequest
}

export const relayTransaction = async (app: App<SharedData>, req: RelayRequestType): Promise<RelayedTransaction> => {
    const requestId = uuidv4()
    const log = (obj: unknown, msg?: string | undefined, ...args: any[]) => logger.info(obj, msg, requestId, ...args)
    const { web3, wallets, config } = app.viewAppData()
    const { entityManagerContractAddress, entityManagerContractRegistryKey, defaultGasLimit } = config
    const { encodedABI, contractRegistryKey } = req
    const gasLimit = req.gasLimit ?? defaultGasLimit

    log({ msg: "new relay request", req })

    // validate transaction and select wallet
    validateSupportedContract([entityManagerContractRegistryKey], contractRegistryKey)
    await validateTransactionData(encodedABI)
    const { privateKey, publicKey } = await wallets.selectNextWallet()
    const senderWallet = new Wallet(privateKey)
    const address = senderWallet.address
    if (address !== publicKey) throw new Error("Invalid relayerPublicKey")

    log("validated relay request")

    // gather some transaction params
    const nonce = await web3.getTransactionCount(address)
    const to = entityManagerContractAddress
    const value = '0x00'
    const data = encodedABI
    const gasPrice = await web3.getGasPrice() // shouldn't need with ACDC

    log({ msg: "gathered tx params", nonce, gasPrice })

    // assemble, sign, and send transaction
    const transaction = { nonce, gasLimit, gasPrice, to, value, data }
    await senderWallet.signTransaction(transaction)
    const submit = await senderWallet.sendTransaction(transaction)

    log("signed and sent")

    // internally polls until mined, basically the same as client's confirmer
    const receipt = await submit.wait()

    // release wallet so next relay can use it
    wallets.release({ publicKey })
    log("released wallet")

    return { receipt, transaction }
}
