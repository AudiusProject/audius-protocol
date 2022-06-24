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
    // asyncSleep,
    getEnv,
    generateSPSignatureParams,
    makeRequest,
    // retryAsyncFunctionOrError
} from "../utils"
import { missedUsersCountGauge, gateway } from "../prometheus"

export const indexContent = async (run_id: number) => {

    console.log(`[${run_id}] indexing content node`)

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

    // console.log(content_nodes)
    // console.log(image_to_content_nodes)

    // await new Promise<void>(async resolve => {
    //     const cn_id: number = parseInt(process.env['CNID'] || '0')
    //     console.log('[+] Content Node index: ', cn_id)
    //     const cnode = content_nodes[cn_id]!
    //     await Promise.all([
    //         // check user clock value
    //         checkUsers(run_id, cnode.spid, cnode.endpoint),

    //         // check user cids
    //         checkCIDS(run_id, cnode.spid, cnode.endpoint, cnode.cid_count),
    //     ])
    //     resolve()
    // })

    const content_nodes = await getAllContentNodes(run_id)

    await Promise.all(
        // for each content node...
        content_nodes.map((cnode, _) => {
            // const image_cid_count: string = image_to_content_nodes[i]?.cid_count || '0'
            return new Promise<void>(async resolve => {
                await Promise.all([
                    // check user clock value
                    checkUsers(run_id, cnode.spid, cnode.endpoint),

                    // check user cids
                    // checkCIDS(run_id, cnode.spid, cnode.endpoint, parseInt(cnode.cid_count), parseInt(image_cid_count)),
                ])
                resolve()
            })
        })
    )

    console.log(`[${run_id}] finished indexing content nodes`)
}


// for batch in batches
//      get clock value
//      save results in non-blocking way
// make sure all results are saved
const checkUsers = async (run_id: number, spid: number, endpoint: string) => {
    console.log(`[${run_id}:${spid}] check users`)

    // const saveQueue: Promise<void>[] = []
    const batchSize = 500

    const { deregisteredCN, signatureSpID, signatureSPDelegatePrivateKey } = getEnv()

    const [primaryCount, secondary1Count, secondary2Count] = await getUserCounts(run_id, spid)

    let missedUsers = 0

    await Promise.all(
        [
            { getBatch: getPrimaryWalletBatch, saveBatch: savePrimaryUserResults, count: primaryCount },
            { getBatch: getSecondary1WalletBatch, saveBatch: saveSecondary1UserResults, count: secondary1Count },
            { getBatch: getSecondary2WalletBatch, saveBatch: saveSecondary2UserResults, count: secondary2Count },
        ].map(async ({ getBatch, saveBatch, count }) => {
            for (let offset = 0; offset < count; offset += batchSize) {
                try {
                    console.log(`[getBatch:${offset}:${batchSize}:${count}]`)
                    const walletBatch = await getBatch(
                        run_id,
                        spid,
                        offset,
                        batchSize,
                    )

                    if (walletBatch.length === 0) { return }

                    const results = await getUserClockValues(
                        endpoint,
                        walletBatch,
                        deregisteredCN,
                        signatureSpID,
                        signatureSPDelegatePrivateKey,
                    )

                    missedUsers += await saveBatch(run_id, spid, results)
                    // add user to save queue
                    // saveQueue.push(saveBatch(run_id, spid, results))
                } catch (e) {
                    console.log(`[checkUsers:${spid}] error - ${(e as Error).message}`)
                }
            }
        })
    )

    // Check to make sure all users saved
    console.log(`[${run_id}:${spid}] missed users ${missedUsers}`)

    missedUsersCountGauge.set({ endpoint, run_id }, missedUsers)

    try {
        // Finish by publishing metrics to prometheus push gateway
        console.log(`[${run_id}] pushing metrics to gateway`);
        await gateway.pushAdd({ jobName: 'network-monitoring' })
    } catch (e) {
        console.log(`[checkUsers] error pushing metrics to pushgateway - ${(e as Error).message}`)
    }
    console.log(`[${run_id}:${spid}] finish saving user content node data to db`)
    // await Promise.all(saveQueue);
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

    const saveQueue: Promise<void>[] = []
    const batchSize = 500

    const { deregisteredCN, signatureSpID, signatureSPDelegatePrivateKey } = getEnv()

    await Promise.all([
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

                saveQueue.push(saveCIDResults(run_id, spid, batch, results))

                // Give the DB and IO a break
                // await asyncSleep(6000)
            }
        })(),
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

                saveQueue.push(saveCIDResults(run_id, spid, batch, results))

                // Give the DB and IO a break
                // await asyncSleep(3000)
            }
        })(),
    ])

    console.log(`[${run_id}:${spid}] finish saving cid content node data to db`)
    await Promise.all(saveQueue);
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
): Promise<{ walletPublicKey: string, clock: number }[]> => {

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
            7,
            false,
            deregisteredCN,
            {},
        )

        if (batchClockStatusResp.canceled) {
            console.log(`[getUsersClockValues canceled] - ${endpoint}`)
            // Return map of wallets to -1 clock (default value)
            return walletPublicKeys.map(walletPublicKey => ({
                walletPublicKey,
                clock: -1
            }))
        }

        const batchClockStatus = batchClockStatusResp.response!.data.data.users
        const batchClockStatusAttemptCount = batchClockStatusResp.attemptCount

        console.log(`[getUserClockValues Complete] ${endpoint} - reqAttemptCount ${batchClockStatusAttemptCount}`)
        return batchClockStatus

    } catch (e) {
        console.log(`[getUserClockValues Error] - ${endpoint} - ${(e as Error).message}`)

        // Return map of wallets to -1 clock (default value)
        return walletPublicKeys.map(walletPublicKey => ({
            walletPublicKey,
            clock: -1
        }))
    }
}


