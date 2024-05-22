import 'dotenv/config'

import { program } from 'commander'
import { cleanupFiles } from './src/cleanupFiles'
import { parseDelivery, reParsePastXml } from './src/parseDelivery'
import { publishValidPendingReleases } from './src/publishRelease'
import { pollS3 } from './src/s3poller'
import { sync } from './src/s3sync'
import { startServer } from './src/server'
import { sources } from './src/sources'
import { sleep } from './src/util'

sources.load()

program
  .name('ddexer')
  .description('CLI to process ddex files')
  .version('0.1')
  .option('-d, --debug', 'output extra debugging')

program
  .command('parse')
  .description('Parse DDEX xml and print results')
  .argument('<source>', 'source name to use')
  .argument('<path>', 'path to ddex xml file')
  .action(async (source, p) => {
    const releases = await parseDelivery(source, p)
    console.log(JSON.stringify(releases, undefined, 2))
  })

program
  .command('publish')
  .description('Publish any valid deliveries')
  .action(async () => {
    reParsePastXml()
    await publishValidPendingReleases()
    process.exit(0) // sdk client doesn't know when to quit
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
  .action(async () => {
    startServer()
  })

program
  .command('worker')
  .description('start background processes, useful for dev')
  .action(async () => {
    startWorker()
  })

program
  .command('start')
  .description('Start both server + background processes')
  .action(async () => {
    startServer()
    startWorker()
  })

program.command('cleanup').description('remove temp files').action(cleanupFiles)

program.parse()

async function startWorker() {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await sleep(3_000)
    console.log('polling...')
    await pollS3()
    await publishValidPendingReleases()
    await sleep(30_000)
  }
}
