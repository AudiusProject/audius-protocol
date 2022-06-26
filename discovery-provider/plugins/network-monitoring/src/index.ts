
import {
    closeDBConnection,
    connectToDBAndRunMigrations
} from './db'
import { indexDiscovery } from './discovery'
import { indexContent } from './content'
import { generateMetrics } from './metrics'
import { totalJobDurationGauge } from './prometheus'

const main = async () => {

    const endTimer = totalJobDurationGauge.startTimer()

    await connectToDBAndRunMigrations()

    const run_id = await indexDiscovery()

    await indexContent(run_id)

    await generateMetrics(run_id)

    await closeDBConnection()

    endTimer({ run_id: run_id })

    process.exit(0)
}

main()