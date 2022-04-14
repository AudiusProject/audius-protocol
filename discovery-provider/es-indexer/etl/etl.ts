import { program } from 'commander'
import pino from 'pino'
import { dialPg } from './conn'
import { runEtl } from './etlRunner'
import { waitForHealthyCluster } from './jobRunner'

// Sleep 1 minute between ETL polling runs
const ETL_POLL_INTERVAL_MS = 1000 * 60 * 1

program
  .name('es-indexer')
  .description('Load data into ElasticSearch')
  .version('0.0.0')

program
  .option('--drop', 'drop + recreate index')
  .option(
    '--jobs <items>',
    'subset of jobs to run (comma separated)',
    'users,tracks,playlists,reposts,saves'
  )
  .option('--poll', 're-run etl polling style')
  .action(async function (options) {
    const logger = pino({ name: `es-indexer` })
    const health = await waitForHealthyCluster()
    logger.info(health, 'cluster health')

    while (true) {
      try {
        await runEtl(options)
      } catch (e) {
        logger.error(e, `uncaught exception in polling loop`)
      }

      if (!options.poll) {
        break
      }
      // sleep
      await new Promise((r) => setTimeout(r, ETL_POLL_INTERVAL_MS))
    }
    await dialPg().end()
  })

program.parse()
