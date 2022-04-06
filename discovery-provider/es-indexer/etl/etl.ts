import { program } from 'commander'
import 'dotenv/config'
import { dialPg } from './conn'
import { runEtl } from './etlRunner'

program
  .name('fuguestate-etl')
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
    while (true) {
      await runEtl(options)
      if (!options.poll) {
        break
      }
      // sleep 2 minutes between polls
      console.log('sleeping...')
      await new Promise((r) => setTimeout(r, 1000 * 60 * 2))
    }
    await dialPg().end()
  })

program.parse()
