
import { 
    create_new_run, 
    import_cids_from_dn, 
    import_cn, 
    import_users 
} from "./db/queries"

export const indexDiscovery = async (): Promise<number> => {

    console.log('[+] indexing discovery database')

    // Create new run in network_monitoring_index_blocks
    const run_id = await create_new_run()

    // Pull Content Nodes into network_monitoring_content_nodes
    await import_cn(run_id)

    // Pull users into network_monitoring_users
    await import_users(run_id)

    // Pull cids into network_monitoring_cids_from_discovery
    await import_cids_from_dn(run_id)

    console.log(`[${run_id}] finished indexing discovery database`)

    return run_id
}
