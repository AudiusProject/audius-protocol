
import {
    closeDBConnection,
    connectToDBAndRunMigrations
} from './db'
// import { indexDiscovery } from './discovery'
import { indexContent } from './content'
import { generateMetrics } from './metrics'
import { gateway, totalJobDurationGauge } from './prometheus'

const main = async () => {

    const endTimer = totalJobDurationGauge.startTimer()

    await connectToDBAndRunMigrations()

    // Index data from the discovery node postgres DB
    // into the separate network monitoring postgres DB
    // const run_id = await indexDiscovery()
    const run_id = 10

    // Fetch data (CIDs and Users) from content nodes
    // and save it into the network monitoring postgres DB
    await indexContent(run_id)

    // Run OLAP-type queries on the network monitoring DB
    // and export the data to the prometheus push-gateway
    // to be later scraped by prometheus
    await generateMetrics(run_id)

    await closeDBConnection()

    // Record job duration and export to prometheus
    endTimer({ run_id: run_id })

    try {
        // Finish by publishing any outstanding metrics to prometheus push gateway
        console.log(`[${run_id}] pushing metrics to gateway`);
        await gateway.pushAdd({ jobName: 'network-monitoring' })
    } catch (e) {
        console.log(`[generateMetrics] error pushing metrics to pushgateway - ${(e as Error).message}`)
    }

    process.exit(0)
}

main()