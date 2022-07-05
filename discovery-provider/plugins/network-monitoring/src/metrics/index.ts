import axios from "axios"
import {
    allUserCountGauge,
    fullySyncedUsersCountGauge,
    gateway,
    generatingMetricsDurationGauge,
    partiallySyncedUsersCountGauge,
    primaryUserCountGauge,
    unsyncedUsersCountGauge,
} from "../prometheus"
import { getEnv } from "../utils"
import {
    getPrimaryUserCount,
    getAllUserCount,
    getFullySyncedUsersCount,
    getPartiallySyncedUsersCount,
    getUnsyncedUsersCount
} from "./queries"

export const generateMetrics = async (run_id: number) => {

    console.log(`[${run_id}] generating metrics`)

    const endTimer = generatingMetricsDurationGauge.startTimer()

    /* 
    - he number of CID on each CN that have been replicated at least once
    - The number of CID on each CN that have ***NOT*** been replicated at least once
    - [ex 1] **The number of users with a specific CN as their primary**
    - The number of users with a specific CN in their replica set
    - CID replication across the CNs
    - CID replication factor
    - The number of users with their data syncs across 0, 1, 2, or 3 CNs
    */

    /*
        - All user count
        - Primary user count
        - # of users by replica set length
        - Replication factor for users
        - Fully synced nodes frequency
        - Avg CIDs per user
        - Histogram of cids per user
    */

    const allUserCount = await getAllUserCount(run_id)

    const primaryUserCount = await getPrimaryUserCount(run_id)

    const fullySyncedUsersCount = await getFullySyncedUsersCount(run_id)

    const partiallySyncedUserCount = await getPartiallySyncedUsersCount(run_id)

    const unsyncedUsersCount = await getUnsyncedUsersCount(run_id)

    allUserCount.forEach(({ endpoint, count }) => {
        allUserCountGauge.set({ endpoint, run_id }, count)
    })
    primaryUserCount.forEach(({ endpoint, count }) => {
        primaryUserCountGauge.set({ endpoint, run_id }, count)
    })

    fullySyncedUsersCountGauge.set({ run_id }, fullySyncedUsersCount)
    partiallySyncedUsersCountGauge.set({ run_id }, partiallySyncedUserCount)
    unsyncedUsersCountGauge.set({ run_id }, unsyncedUsersCount)

    // Record duration for generating metrics and export to prometheus
    endTimer({ run_id: run_id })

    await publishSlackReport({
        allUsersCount: allUserCount,
        primaryUsersCount: primaryUserCount,
        fullySyncedUsersCount: fullySyncedUsersCount,
        partiallySyncedUsersCount: partiallySyncedUserCount,
        unsyncedUsersCount: unsyncedUsersCount,
    })

    try {
        // Finish by publishing metrics to prometheus push gateway
        console.log(`[${run_id}] pushing metrics to gateway`);
        await gateway.pushAdd({ jobName: 'network-monitoring' })
    } catch (e) {
        console.log(`[generateMetrics] error pushing metrics to pushgateway - ${(e as Error).message}`)
    }


    console.log(`[${run_id}] finish generating metrics`);
}

const publishSlackReport = async (metrics: Object) => {

    const { slack } = getEnv()

    if (
        slack.token === '' 
        || slack.url === '' 
        || slack.channelId === ''
    ) {
        return
    }

    let message = metrics.toString()

    try {
        await axios.post(slack.url, { token: slack.token, channel: slack.channelId, text: message })
    } catch (e) {
        console.log(`Error posting to slack in slack reporter ${(e as Error).toString()}`)
    }
}