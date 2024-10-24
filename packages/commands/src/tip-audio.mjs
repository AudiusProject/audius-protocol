import chalk from 'chalk'
import { program } from 'commander'

import { initializeAudiusLibs, initializeAudiusSdk } from './utils.mjs'
import { Utils } from '@audius/sdk-legacy/dist/libs.js'

program
  .command('tip-audio')
  .description('Send a tip')
  .argument('<userId>', 'The user ID to tip tokens to')
  .argument('<amount>', 'The amount of tokens to tip (in wAUDIO)', parseFloat)
  .option('-f, --from [from]', 'The account to tip from')
  .action(async (userId, amount, { from }) => {
    const audiusLibs = await initializeAudiusLibs(from)

    // extract privkey and pubkey from hedgehog
    // only works with accounts created via audius-cmd
    const wallet = audiusLibs?.hedgehog?.getWallet()
    const privKey = wallet?.getPrivateKeyString()
    const pubKey = wallet?.getAddressString()

    // Get hashID user id of current user
    const userIdNumber = audiusLibs.userStateManager.getCurrentUserId()
    const senderUserId = Utils.encodeHashId(userIdNumber)

    // init sdk with priv and pub keys as api keys and secret
    // this enables writes via sdk
    const audiusSdk = await initializeAudiusSdk({
      apiKey: pubKey,
      apiSecret: privKey
    })

    try {
      const res = await audiusSdk.users.sendTip({
        senderUserId,
        receiverUserId: Utils.encodeHashId(userId),
        amount
      })
      console.log(chalk.green('Successfully tipped audio'))
      console.log(chalk.yellow('Transaction Signature:'), res)
    } catch (err) {
      if ('response' in err) {
        console.log(
          chalk.red('Request ID:'),
          err.response.headers.get('x-request-id')
        )
        console.log(chalk.red('Response JSON:'), await err.response.json())
      }
      program.error(err.message)
    }

    process.exit(0)
  })
