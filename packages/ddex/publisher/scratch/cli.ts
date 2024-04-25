import 'dotenv/config'

import { program } from 'commander'
import { parseDelivery } from './parseDelivery'
import { cleanupFiles } from './cleanupFiles'
import { pollS3 } from './s3poller'
import { publishValidPendingReleases } from './publishRelease'
import { sync } from './s3sync'

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

program.command('cleanup').description('remove temp files').action(cleanupFiles)

program.parse()
const globalOptions = program.opts()
