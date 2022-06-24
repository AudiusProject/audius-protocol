
import { indexingDiscoveryDurationGauge } from "../prometheus"
import { exportDuration } from "../utils"
import { 
    createNewRun, 
    importCids, 
    importContentNodes, 
    importUsers 
} from "./queries"


export const indexDiscovery = async (): Promise<number> => {

    console.log('[+] indexing discovery database')

    const t0 = process.hrtime()

    // Create new run in table `network_monitoring_index_blocks`
    const run_id = await createNewRun()

    // Pull Content Nodes list into table `network_monitoring_content_nodes`
    await importContentNodes(run_id)

    // Pull table `users` into table `network_monitoring_users`
    await importUsers(run_id)

    // Pull cids into table `network_monitoring_cids_from_discovery`
    await importCids(run_id)

    const tDelta = process.hrtime(t0)
    await exportDuration(tDelta, run_id, indexingDiscoveryDurationGauge)

    console.log(`[${run_id}] finished indexing discovery database (${tDelta})`)

    return run_id
}