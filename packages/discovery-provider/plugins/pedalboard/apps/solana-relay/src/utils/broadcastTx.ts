import { Connection } from "@solana/web3.js"
import { getConnection } from "./connections"
import { cacheTransaction, getCachedDiscoveryNodes } from "../redis"
import { Logger } from "pino"
import { logger as defaultLogger } from "../logger"
import { personalSign } from "eth-sig-util"
import { config } from "../config"

/**
 * Forwards the transaction response to other Solana Relays on other discovery
 * nodes so that they can cache it to lighten the RPC load on indexing.
 */
export const forwardTransaction = async (logger: Logger, transaction: string) => {
    const endpoints = await getCachedDiscoveryNodes()
    logger.info(`Forwarding to ${endpoints.length} endpoints...`)
    const body = JSON.stringify({ transaction })
    await Promise.all(
        endpoints
            .filter((p) => p.endpoint !== config.endpoint)
            .map(({ endpoint }) =>
                fetch(`${endpoint}/solana/cache`, {
                    method: 'POST',
                    body,
                    headers: {
                        'content-type': 'application/json',
                        'Discovery-Signature': personalSign(config.delegatePrivateKey, {
                            data: body
                        })
                    }
                })
                    .then((res) => {
                        if (res.ok) {
                            logger.info(
                                { endpoint, status: res.status },
                                `Forwarded successfully`
                            )
                        } else {
                            logger.warn(
                                { endpoint },
                                `Failed to forward transaction to endpoint: ${res.statusText}`
                            )
                        }
                    })
                    .catch((e) => {
                        logger.warn(
                            { endpoint },
                            `Failed to forward transaction to endpoint: ${e}`
                        )
                    })
            )
    )
}

export const broadcastTx = async ({ signature, confirm, logger }: { signature: string, confirm: boolean, logger?: Logger }) => {
    logger = logger !== undefined ? logger : defaultLogger
    const connection = getConnection()

    if (confirm) {
        // Confirm, fetch, cache and forward after success response.
        // The transaction may be confirmed from specifying commitment before,
        // but that may have been a different RPC. So confirm again.
        logger.info(`Confirming transaction before fetching...`)
        const strategy = await connection.getLatestBlockhash()
        const confirmationStrategy = { ...strategy, signature }
        await connection.confirmTransaction(confirmationStrategy, 'confirmed')
    }
    logger.info('Fetching transaction for caching...')
    // Dangerously relying on the internals of connection to do the fetch.
    // Calling connection.getTransaction will result in the library parsing the
    // results and getting us back our object again, but we need the raw JSON
    // for Solders to know what we're talking about when indexing.
    const rpcResponse = await (
        connection as Connection & {
            _rpcRequest: (
                methodName: string,
                args: Array<unknown>
            ) => Promise<unknown>
        }
    )._rpcRequest('getTransaction', [
        signature,
        {
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed',
            encoding: 'json'
        }
    ])
    const formattedResponse = JSON.stringify(rpcResponse)
    logger.info('Caching transaction...')
    await cacheTransaction(signature, formattedResponse)
    logger.info('Forwarding transaction to other nodes to cache...')
    await forwardTransaction(logger, formattedResponse)
}
