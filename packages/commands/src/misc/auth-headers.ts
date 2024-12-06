import chalk from 'chalk'
import { Command } from '@commander-js/extra-typings'

import { initializeAudiusSdk } from '../utils.js'

export const authHeadersCommand = new Command('auth-headers')
  .description(
    'Output auth headers (for use with curl: `curl -H @<(audius-cmd auth-headers)`)'
  )
  .option('-f, --from <from>', 'The account for which to generate auth headers')
  .action(async ({ from }) => {
    const audiusSdk = await initializeAudiusSdk({ handle: from })

    const unixTimestamp = Math.round(new Date().getTime() / 1000)
    const message = `signature:${unixTimestamp}`
    const signature = await audiusSdk.services.audiusWalletClient.signMessage({
      message
    })
    console.log(chalk.yellow.bold('Encoded-Data-Message:'), message)
    console.log(chalk.yellow.bold('Encoded-Data-Signature:'), signature)
  })
