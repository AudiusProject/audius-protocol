import {
    getCIDBatch,
    // getEndpointToCIDCount,
    // getEndpointToImageCIDCount,
    getImageCIDBatch,
    saveCIDResults,
    getUserCounts,
    getAllContentNodes,
    getPrimaryWalletBatch,
    getSecondary1WalletBatch,
    getSecondary2WalletBatch,
    savePrimaryUserResults,
    saveSecondary1UserResults,
    saveSecondary2UserResults,
} from "./queries"
import {
    getEnv,
    generateSPSignatureParams,
    makeRequest,
} from "../utils"
import {
    missedUsersCountGauge,
    gateway,
    indexingContentDurationGauge,
    userBatchDurationGauge,
} from "../prometheus"

export const indexContent = async (run_id: number) => {

    console.log(`[${run_id}] indexing content node`)

    const endTimer = indexingContentDurationGauge.startTimer()

    // get every content node and cid size
    // const content_nodes: {
    //     spid: number,
    //     endpoint: string,
    //     cid_count: string
    // }[] = await retryAsyncFunctionOrError(5, async () => {
    //     const content_nodes: {
    //         spid: number,
    //         endpoint: string,
    //         cid_count: string
    //     }[] = await getEndpointToCIDCount(run_id)

    //     return content_nodes
    // })

    // const image_to_content_nodes: {
    //     spid: number,
    //     endpoint: string,
    //     cid_count: string
    // }[] = await retryAsyncFunctionOrError(5, async () => {
    //     const content_nodes: {
    //         spid: number,
    //         endpoint: string,
    //         cid_count: string
    //     }[] = await getEndpointToImageCIDCount(run_id)

    //     return content_nodes
    // })

    const contentNodes = await getAllContentNodes(run_id)

    await Promise.all(
        // for each content node...
        contentNodes.map(async (cnode, _) => {

            // const image_cid_count: string = image_to_content_nodes[i]?.cid_count || '0'
            await Promise.all([
                // check user clock value
                checkUsers(run_id, cnode.spid, cnode.endpoint),

                // check user cids
                // checkCIDS(run_id, cnode.spid, cnode.endpoint, parseInt(cnode.cid_count), parseInt(image_cid_count)),
            ])
        })
    )

    endTimer({ run_id: run_id })
    console.log(`[${run_id}] finished indexing content nodes`)
}

// for batch in batches
//      get clock value
//      save results in non-blocking way
// make sure all results are saved
const checkUsers = async (run_id: number, spid: number, endpoint: string) => {
    console.log(`[${run_id}:${spid}] check users`)

    const batchSize = 5000

    const { deregisteredCN, signatureSpID, signatureSPDelegatePrivateKey } = getEnv()

    const [primaryCount, secondary1Count, secondary2Count] = await getUserCounts(run_id, spid)

    let missedUsers = 0

    // In parallel, for every replica in a user's replica set (primary, secondary1, secondary2)
    // that equals the current content node endpoint (${endpoint})
    //      Get the user's wallets
    // .    Get the clock value for that user from the content node 
    // .    Save the clock value in the network_monitoring DB
    await Promise.all(
        [
            // Methods for fetching and saving the user's primary node
            { getBatch: getPrimaryWalletBatch, saveBatch: savePrimaryUserResults, count: primaryCount },

            // Methods for fetching and saving the user's secondary1 node
            { getBatch: getSecondary1WalletBatch, saveBatch: saveSecondary1UserResults, count: secondary1Count },

            // Methods for fetching and saving the user's secondary2 node
            { getBatch: getSecondary2WalletBatch, saveBatch: saveSecondary2UserResults, count: secondary2Count },
        ].map(async ({ getBatch, saveBatch, count }) => {

            for (let offset = 0; offset < count; offset += batchSize) {
                try {

                    let endBatchTimer = userBatchDurationGauge.startTimer()

                    // Fetch a batch of users from the network_monitoring postgres DB
                    const walletBatch = await getBatch(
                        run_id,
                        spid,
                        offset,
                        batchSize,
                    )
                    console.log(`[getBatch:${offset}:${batchSize}:${count}]`)

                    if (walletBatch.length === 0) { continue }

                    // Fetch the clock values for all the users in the batch from 
                    // the content nodes in their replica set
                    const { canceledUsers, results } = await getUserClockValues(
                        endpoint,
                        walletBatch,
                        deregisteredCN,
                        signatureSpID,
                        signatureSPDelegatePrivateKey,
                    )
                    missedUsers += canceledUsers

                    console.log(`[getUserClockValues ${run_id}:${spid}:${offset}] `)

                    missedUsers += await saveBatch(run_id, spid, results)

                    console.log(`[savebatch ${run_id}:${spid}:${offset}]`)

                    // Record the duration for the batch and export to prometheus
                    endBatchTimer({ run_id: run_id, endpoint: endpoint })

                    try {
                        // Publish metrics to prometheus push gateway
                        console.log(`[${run_id}] pushing metrics to gateway`);
                        await gateway.pushAdd({ jobName: 'network-monitoring' })
                    } catch (e) {
                        console.log(`[checkUsers(batch)] error pushing metrics to pushgateway - ${(e as Error).message}`)
                    }
                } catch (e) {
                    console.log(`[checkUsers:${spid}] error - ${(e as Error).message}`)
                    missedUsers += batchSize
                }
            }
        })
    )

    // Check to make sure all users saved
    console.log(`[${run_id}:${spid}] missed users ${missedUsers}`)

    // Record the number of usered skipped/errored for the endpoint and export to prometheus
    missedUsersCountGauge.set({ endpoint, run_id }, missedUsers)

    try {
        // Finish by publishing metrics to prometheus push gateway
        console.log(`[${run_id}] pushing metrics to gateway`);
        await gateway.pushAdd({ jobName: 'network-monitoring' })
    } catch (e) {
        console.log(`[checkUsers] error pushing metrics to pushgateway - ${(e as Error).message}`)
    }

    console.log(`[${run_id}:${spid}] finish saving user content node data to db`)
}

// for batch in batches
//      check cids
//      go run sql query in background and don't block
// end for
// wait until sql queries are finished
export const checkCID = async (
    run_id: number,
    spid: number,
    endpoint: string,
    cidCount: number,
    imageCidCount: number
) => {
    console.log(`[${run_id}:${spid}] check cids`)

    const batchSize = 500

    const { deregisteredCN, signatureSpID, signatureSPDelegatePrivateKey } = getEnv()

    // CIDs that point to images vs CIDs that d
    await Promise.all([
        // Handler for non-image CIDs
        (async () => {
            if (cidCount === 0) { return }

            for (let offset = 0; offset < cidCount; offset += batchSize) {
                const batch = await getCIDBatch(run_id, endpoint, offset, batchSize)

                if (batch.length === 0) { continue }

                const results = await checkIfCIDsExistOnCN(
                    endpoint,
                    batch,
                    deregisteredCN,
                    signatureSpID,
                    signatureSPDelegatePrivateKey,
                    false
                )

                await saveCIDResults(run_id, spid, batch, results)
            }
        })(),

        // Handler for image CIDs
        (async () => {
            if (imageCidCount === 0) { return }
            for (let offset = 0; offset < imageCidCount; offset += batchSize) {
                const batch = await getImageCIDBatch(run_id, endpoint, offset, batchSize)

                if (batch.length === 0) { continue }

                const results = await checkIfCIDsExistOnCN(
                    endpoint,
                    batch,
                    deregisteredCN,
                    signatureSpID,
                    signatureSPDelegatePrivateKey,
                    true
                )

                await saveCIDResults(run_id, spid, batch, results)
            }
        })(),
    ])

    console.log(`[${run_id}:${spid}] finish saving cid content node data to db`)
}

const checkIfCIDsExistOnCN = async (
    endpoint: string,
    batch: { cid: string, user_id: number }[],
    deregisteredCN: string[],
    signatureSpID: number | undefined,
    signatureSPDelegatePrivateKey: string | undefined,
    imageType: boolean = false,
): Promise<boolean[]> => {
    const route = (imageType) ? '/batch_image_cids_exist' : '/batch_cids_exist'

    try {
        const axiosReqObj = {
            method: 'post',
            url: route,
            baseURL: endpoint,
            data: { cids: batch.map(item => item.cid.split('"').join('')) },
            params: {}
        }

        if (signatureSpID && signatureSPDelegatePrivateKey) {
            axiosReqObj.params = generateSPSignatureParams(signatureSpID, signatureSPDelegatePrivateKey)
        }

        const numCIDsInBatch = batch.length
        const additionalInfo = { numCIDsInBatch }
        const batchResp = await makeRequest(
            axiosReqObj,
            7,
            false,
            deregisteredCN,
            additionalInfo,
        )

        if (batchResp.canceled) {
            console.log(`[${endpoint}:checkIfCIDsExistOnCN canceled] - ${endpoint}${route} - numCIDs ${batch.length}`)
            return batch.map(_ => false)
        }

        const cidsExistBatch: boolean[] = batchResp.response!.data.data.cids
        return cidsExistBatch

    } catch (e) {
        console.log(`[${endpoint}:checkIfCIDsExistOnCN Error] - ${endpoint}${route} - numCIDs ${batch.length} - ${(e as Error).message}`)
        return batch.map(_ => false)
    }
}

const getUserClockValues = async (
    endpoint: string,
    walletPublicKeys: string[],
    deregisteredCN: string[],
    signatureSpID: number | undefined,
    signatureSPDelegatePrivateKey: string | undefined,
): Promise<{
    canceledUsers: number, 
    results: {
        walletPublicKey: string,
        clock: number
    }[],
}> => {

    try {
        const axiosReqObj = {
            method: 'post',
            url: '/users/batch_clock_status',
            baseURL: endpoint,
            data: { walletPublicKeys },
            params: {},
        }

        if (signatureSpID && signatureSPDelegatePrivateKey) {
            axiosReqObj.params = generateSPSignatureParams(signatureSpID, signatureSPDelegatePrivateKey)
        }

        const batchClockStatusResp = await makeRequest(
            axiosReqObj,
            3,
            false,
            deregisteredCN,
            {},
        )

        if (batchClockStatusResp.canceled) {
            console.log(`[getUsersClockValues canceled] - ${endpoint}`)
            // Return map of wallets to -1 clock (default value)
            return {
                canceledUsers: walletPublicKeys.length,
                results: walletPublicKeys.map(walletPublicKey => ({
                    walletPublicKey,
                    clock: -1
                }))
            }
        }

        const batchClockStatus = batchClockStatusResp.response!.data.data.users
        const batchClockStatusAttemptCount = batchClockStatusResp.attemptCount

        console.log(`[getUserClockValues Complete] ${endpoint} - reqAttemptCount ${batchClockStatusAttemptCount}`)
        return { canceledUsers: 0, results: batchClockStatus }

    } catch (e) {
        console.log(`[getUserClockValues Error] - ${endpoint} - ${(e as Error).message}`)

        // Return map of wallets to -1 clock (default value)
        return {
            canceledUsers: walletPublicKeys.length,
            results: walletPublicKeys.map(walletPublicKey => ({
                walletPublicKey,
                clock: -1
            })),
        }
    }
}