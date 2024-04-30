import 'dotenv/config'

import { program } from 'commander'
import { parseDelivery } from './src/parseDelivery'
import { cleanupFiles } from './src/cleanupFiles'
import { pollS3 } from './src/s3poller'
import { publishValidPendingReleases } from './src/publishRelease'
import { sync } from './src/s3sync'
import { startServer } from './src/server'
import { sleep } from './src/util'

program
  .name('ddexer')
  .description('CLI to process ddex files')
  .version('0.1')
  .option('-d, --debug', 'output extra debugging')

program
  .command('parse')
  .description('Parse DDEX xml and print results')
  .argument('<path>', 'path to ddex xml file')
  .action(async (p) => {
    const releases = await parseDelivery(p)
    console.log(JSON.stringify(releases, undefined, 2))
  })

program
  .command('publish')
  .description('Publish any valid deliveries')
  .action(async () => {
    await publishValidPendingReleases()
  })

program
  .command('sync-s3')
  .description('Sync target directory from S3')
  .argument('<path>', 'path after s3:// to sync')
  .action(async (p) => {
    await sync(p)
  })

program
  .command('poll-s3')
  .description('Pull down assets from S3 and process')
  .option('--reset', 'reset cursor, start from beginning')
  .action(async (opts) => {
    await pollS3(opts.reset)
  })

program
  .command('server')
  .description('start server without background processes, useful for dev')
  .action(async (opts) => {
    startServer()
  })

program
  .command('worker')
  .description('start background processes, useful for dev')
  .action(async (opts) => {
    startWorker()
  })

program
  .command('start')
  .description('Start both server + background processes')
  .action(async (opts) => {
    startServer()
    startWorker()
  })

program.command('cleanup').description('remove temp files').action(cleanupFiles)

program.parse()
const globalOptions = program.opts()

async function startWorker() {
  while (true) {
    await sleep(3_000)
    console.log('polling...')
    await pollS3()
    await publishValidPendingReleases()
    await sleep(30_000)
  }
}
