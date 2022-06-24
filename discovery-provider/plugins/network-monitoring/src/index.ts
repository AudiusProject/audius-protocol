
import {
    closeDBConnection,
    connectToDBAndRunMigrations
} from './db'
import { indexDiscovery } from './discovery'
import { indexContent } from './content'
import { generateMetrics } from './metrics'
import { exportDuration } from './utils'
import { totalJobDurationGauge } from './prometheus'

const main = async () => {

    const t0 = process.hrtime()

    await connectToDBAndRunMigrations()

    const run_id = await indexDiscovery()

    await indexContent(run_id)

    await generateMetrics(run_id)

    await closeDBConnection()

    const tDelta = process.hrtime(t0)[0]
    await exportDuration(tDelta, run_id, totalJobDurationGauge)

    process.exit(0)
}

main()