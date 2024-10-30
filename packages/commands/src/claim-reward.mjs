import chalk from 'chalk'
import { program } from 'commander'

import { initializeAudiusLibs, initializeAudiusSdk } from './utils.mjs'
import { Utils } from '@audius/sdk-legacy/dist/libs.js'

program
  .command('claim-reward')
  .description('Claim a challenge reward')
  .argument('<challengeId>', 'The ID of the challenge to claim')
  .argument('<amount>', 'The amount to claim', parseFloat)
  .option('-f, --from [from]', 'The account to claim from')
  .option(
    '-c, --contentId [contentId]',
    'The track or album purchased (for Audio Match challenges)'
  )
  .option(
    '-r, --referredUserId [referredUserId]',
    'The user referred (for referral challenges)'
  )
  .action(async (challengeId, amount, { from, contentId, referredUserId }) => {
    const audiusLibs = await initializeAudiusLibs(from)

    // extract privkey and pubkey from hedgehog
    // only works with accounts created via audius-cmd
    const wallet = audiusLibs?.hedgehog?.getWallet()
    const privKey = wallet?.getPrivateKeyString()
    const pubKey = wallet?.getAddressString()

    // Get hashID user id of current user
    const userIdNumber = audiusLibs.userStateManager.getCurrentUserId()
    const userId = Utils.encodeHashId(userIdNumber)

    // init sdk with priv and pub keys as api keys and secret
    // this enables writes via sdk
    const audiusSdk = await initializeAudiusSdk({
      apiKey: pubKey,
      apiSecret: privKey
    })

    try {
      const specifier = await audiusSdk.challenges.generateSpecifier({
        challengeId,
        userId,
        contentId,
        referredUserId
      })
      const res = await audiusSdk.challenges.claimReward({
        userId,
        challengeId,
        specifier,
        amount
      })
      console.log(chalk.green('Successfully claimed reward'))
      console.log(chalk.yellow('Transaction Signature:'), res)
    } catch (err) {
      if ('response' in err) {
        console.log(
          chalk.red('Request ID:'),
          err.response.headers.get('X-Request-ID')
        )
        console.log(chalk.red('Request URL:'), err.response.url)
        console.log(chalk.red('Response Body:'), await err.response.text())
      }
      program.error(err.message)
    }

    process.exit(0)
  })

program
  .command('reward-specifier')
  .description('Get the specifier for a challenge')
  .argument('<challengeId>', 'The ID of the challenge')
  .option('-f, --from [from]', 'The account to call from')
  .option('-c, --contentId [contentId]', 'The track or album purchased')
  .option('-r, --referredUserId [referredUserId]', 'The user referred')
  .action(async (challengeId, { from, contentId, referredUserId }) => {
    const audiusLibs = await initializeAudiusLibs(from)

    // extract privkey and pubkey from hedgehog
    // only works with accounts created via audius-cmd
    const wallet = audiusLibs?.hedgehog?.getWallet()
    const privKey = wallet?.getPrivateKeyString()
    const pubKey = wallet?.getAddressString()

    // Get hashID user id of current user
    const userIdNumber = audiusLibs.userStateManager.getCurrentUserId()
    const userId = Utils.encodeHashId(userIdNumber)

    // init sdk with priv and pub keys as api keys and secret
    // this enables writes via sdk
    const audiusSdk = await initializeAudiusSdk({
      apiKey: pubKey,
      apiSecret: privKey
    })

    const specifier = await audiusSdk.challenges.generateSpecifier({
      challengeId,
      userId,
      contentId,
      referredUserId
    })
    console.log(chalk.yellow('Specifier:'), specifier)

    process.exit(0)
  })
