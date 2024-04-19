import 'dotenv/config'

import { program } from 'commander'
import { parseDdexXmlFile, parseDelivery } from './parseDelivery'
import { cleanupFiles } from './cleanupFiles'
import { pollS3 } from './s3poller'

program
  .name('ddexer')
  .description('CLI to process ddex files')
  .version('0.1')
  .option('-d, --debug', 'output extra debugging')

program
  .command('parse')
  .description('Parse DDEX xml and print results')
  .argument('<path>', 'path to ddex xml file')
  .action(async (p, options) => {
    const releases = await parseDdexXmlFile(p)
    console.log(JSON.stringify(releases, undefined, 2))
  })

program
  .command('process')
  .description('Process DDEX delivery on local filesystem')
  .argument('<path>', 'path to ddex xml or zip file')
  .action(async (p, options) => {
    const results = await parseDelivery(p)
    console.log('ok', results)
  })

program
  .command('process-s3')
  .description('Pull down assets from S3 and process')
  .action(async () => {
    await pollS3()
  })

program.command('cleanup').description('remove temp files').action(cleanupFiles)

program.parse()
const globalOptions = program.opts()
