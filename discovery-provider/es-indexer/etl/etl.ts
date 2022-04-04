import 'dotenv/config'

import { program } from 'commander'
import { dialEs, dialPg } from './conn'
import { runEtl } from './etlRunner'
import { trackEtl } from './trackEtl'

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

// a quick example of reindex from tracks to tracks2
// takes about
program.command('reindex').action(async (options) => {
  const es = dialEs()

  const job = trackEtl
  job.indexSettings.index = 'tracks2'
  console.log(job.indexSettings)
  await es.indices.delete({ index: job.indexSettings.index }, { ignore: [404] })
  await es.indices.create(job.indexSettings)

  // tried setting timeout, and options.requestTimeout but it still times out
  // seems ya just gotta do wait_for_completion: false
  // and poll the task status
  // takes 3.5 mins on my machine
  // versus 13 mins from postgres...
  // so might be worth the trouble when doing mapping changes.
  const taskId = await es.reindex({
    source: {
      index: 'tracks',
    },
    dest: {
      index: 'tracks2',
    },
    wait_for_completion: false,
  })

  while (true) {
    await new Promise((r) => setTimeout(r, 1000))
    let ok = await es.tasks.get({
      task_id: taskId.task as string,
    })
    if (ok.completed) {
      break
    }
    console.log(`reindex ${ok.task.status.created} ${ok.task.status.total}`)
  }

  console.log(taskId)
})

program.parse()
