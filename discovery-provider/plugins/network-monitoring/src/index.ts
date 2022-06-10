
require('dotenv').config({ path: '.env.stage' })

import { connectToDBAndRunMigrations } from './db'
import { indexDiscovery } from './discovery'
import { indexContent } from './content'
import { generateMetrics } from './metrics'

const main = async () => {

    await connectToDBAndRunMigrations()

    const run_id = await indexDiscovery()

    await indexContent(run_id)

    await generateMetrics(run_id)

    process.exit(0)
}

main()