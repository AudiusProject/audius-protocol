import chalk from 'chalk'
import { program } from 'commander'

import { initializeAudiusSdk } from './utils.mjs'

program
  .command('auth-headers')
  .description(
    'Output auth headers (for use with curl: `curl -H @<(audius-cmd auth-headers)`)'
  )
  .option('-f, --from [from]', 'The account for which to generate auth headers')
  .action(async ({ from }) => {
    const audiusSdk = await initializeAudiusSdk({ handle: from })

    try {
      const unixTimestamp = Math.round(new Date().getTime() / 1000)
      const message = `signature:${unixTimestamp}`
      const prefix = `\x19Ethereum Signed Message:\n${message.length}`
      const prefixedMessage = prefix + message

      const [sig, recid] = await audiusSdk.services.auth.sign(
        Buffer.from(prefixedMessage, 'utf-8')
      )
      const r = Buffer.from(sig.slice(0, 32)).toString('hex')
      const s = Buffer.from(sig.slice(32, 64)).toString('hex')
      const v = (recid + 27).toString(16)

      const signature = `0x${r}${s}${v}`

      console.log(chalk.yellow('Encoded-Data-Message:'), message)
      console.log(chalk.yellow('Encoded-Data-Signature:'), signature)
    } catch (err) {
      program.error(err.message)
    }

    process.exit(0)
  })
