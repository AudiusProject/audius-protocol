
import { instrumentTracing, setupTracing, tracing } from './tracer'
setupTracing()

import {
    closeDBConnection,
    connectToDBAndRunMigrations
} from './db'
import { indexDiscovery } from './discovery'
import { generateMetrics } from './metrics'
import { gateway, totalJobDurationGauge } from './prometheus'

const main = async () => {

    const endTimer = totalJobDurationGauge.startTimer()

    await connectToDBAndRunMigrations()

    // Index data from the discovery node postgres DB
    // into the separate network monitoring postgres DB
    const run_id = await indexDiscovery()

    // Run OLAP-type queries on the network monitoring DB
    // and export the data to the prometheus push-gateway
    // to be later scraped by prometheus
    await generateMetrics(run_id)

    await closeDBConnection()

    // Record job duration and export to prometheus
    endTimer({ run_id: run_id })

    try {
        // Finish by publishing any outstanding metrics to prometheus push gateway
        tracing.info(`[${run_id}] pushing metrics to gateway`);
        await gateway.pushAdd({ jobName: 'network-monitoring' })
    } catch (e: any) {
        tracing.recordException(e)
        tracing.error(`[generateMetrics] error pushing metrics to pushgateway - ${e.message}`)
    }
}

instrumentTracing({
    name: 'network-monitoring-run',
    fn: main,
})()
