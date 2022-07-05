
import { indexingDiscoveryDurationGauge } from "../prometheus"
import {
    createNewRun,
    deleteOldRunData,
    importCids,
    importContentNodes,
    importUsers
} from "./queries"


export const indexDiscovery = async (): Promise<number> => {

    console.log('[+] indexing discovery database')

    const endTimer = indexingDiscoveryDurationGauge.startTimer()

    // Create new run in table `network_monitoring_index_blocks`
    const run_id = await createNewRun()

    // Delete old runs
    await deleteOldRunData(run_id)

    // Pull Content Nodes list into table `network_monitoring_content_nodes`
    await importContentNodes(run_id)

    // Pull table `users` into table `network_monitoring_users`
    await importUsers(run_id)

    // Pull cids into table `network_monitoring_cids_from_discovery`
    await importCids(run_id)

    // Record indexing duration and export to push-gateway
    endTimer({ run_id: run_id })

    console.log(`[${run_id}] finished indexing discovery database`)

    return run_id
}