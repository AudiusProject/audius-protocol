import axios from "axios"
import {
    allUserCountGauge,
    fullySyncedUsersCountGauge,
    gateway,
    generatingMetricsDurationGauge,
    nullPrimaryUsersCountGauge,
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
    getUnsyncedUsersCount,
    getUsersWithNullPrimaryClock
} from "./queries"

export const generateMetrics = async (run_id: number) => {

    console.log(`[${run_id}] generating metrics`)

    const endTimer = generatingMetricsDurationGauge.startTimer()

    const allUserCount = await getAllUserCount(run_id)

    const primaryUserCount = await getPrimaryUserCount(run_id)

    const fullySyncedUsersCount = await getFullySyncedUsersCount(run_id)

    const partiallySyncedUserCount = await getPartiallySyncedUsersCount(run_id)

    const unsyncedUsersCount = await getUnsyncedUsersCount(run_id)

    const usersWithNullPrimaryClock = await getUsersWithNullPrimaryClock(run_id)

    allUserCount.forEach(({ endpoint, count }) => {
        allUserCountGauge.set({ endpoint, run_id }, count)
    })
    primaryUserCount.forEach(({ endpoint, count }) => {
        primaryUserCountGauge.set({ endpoint, run_id }, count)
    })

    fullySyncedUsersCountGauge.set({ run_id }, fullySyncedUsersCount)
    partiallySyncedUsersCountGauge.set({ run_id }, partiallySyncedUserCount)
    unsyncedUsersCountGauge.set({ run_id }, unsyncedUsersCount)
    nullPrimaryUsersCountGauge.set({ run_id }, usersWithNullPrimaryClock)

    // Record duration for generating metrics and export to prometheus
    endTimer({ run_id: run_id })

    await publishSlackReport({
        fullySyncedUsersCount: fullySyncedUsersCount,
        partiallySyncedUsersCount: partiallySyncedUserCount,
        unsyncedUsersCount: unsyncedUsersCount,
        usersWithNullPrimaryClock: usersWithNullPrimaryClock
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

    const { slackUrl } = getEnv()

    if (slackUrl === '') {
        return
    }

    let message = `\`\`\`${JSON.stringify(metrics, null, 2)}\`\`\`` 
    console.log(message)

    try {
        await axios.post(
            slackUrl,
            {
                text: message,
            }, 
        )
    } catch (e) {
        console.log(`Error posting to slack in slack reporter ${(e as Error).toString()}`)
    }
}