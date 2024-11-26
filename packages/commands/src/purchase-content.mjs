import chalk from 'chalk'
import { program } from 'commander'

import { initializeAudiusSdk, getCurrentAudiusSdkUser } from './utils.mjs'
import { Utils } from '@audius/sdk-legacy/dist/libs.js'

program
  .command('purchase-track')
  .description('Buys a track using USDC')
  .argument('<id>', 'The track ID')
  .argument('<price>', 'The expected price of the track', parseFloat)
  .option('-f, --from [from]', 'The account purchasing the content (handle)')
  .option(
    '-e, --extra-amount [amount]',
    'Extra amount to pay in addition to the price (in dollars)',
    parseFloat
  )
  .action(async (id, price, { from, extraAmount }) => {
    const audiusSdk = await initializeAudiusSdk({
      handle: from
    })
    const currentUser = await getCurrentAudiusSdkUser()
    const userId = currentUser.id
    const trackId = Utils.encodeHashId(id)

    try {
      console.log('Purchasing track...', {
        trackId,
        userId,
        price,
        extraAmount
      })
      const response = await audiusSdk.tracks.purchaseTrack({
        trackId,
        userId,
        price,
        extraAmount,
        includeNetworkCut: true
      })
      console.log(chalk.green('Successfully purchased track'))
      console.log(chalk.yellow('Transaction Signature:'), response)
    } catch (err) {
      program.error(err)
    }
    process.exit(0)
  })

program
  .command('purchase-album')
  .description('Buys an album using USDC')
  .argument('<id>', 'The album ID')
  .argument('<price>', 'The expected price of the album', parseFloat)
  .option('-f, --from [from]', 'The account purchasing the content (handle)')
  .option(
    '-e, --extra-amount [amount]',
    'Extra amount to pay in addition to the price (in dollars)',
    parseFloat
  )
  .action(async (id, price, { from, extraAmount }) => {
    const audiusSdk = await initializeAudiusSdk({
      handle: from
    })
    const currentUser = await getCurrentAudiusSdkUser()
    const userId = currentUser.id
    const albumId = Utils.encodeHashId(id)

    try {
      console.log('Purchasing album...', {
        albumId,
        userId,
        price,
        extraAmount
      })
      const response = await audiusSdk.albums.purchaseAlbum({
        albumId,
        userId,
        price,
        extraAmount,
        includeNetworkCut: true
      })
      console.log(chalk.green('Successfully purchased album'))
      console.log(chalk.yellow('Transaction Signature:'), response)
    } catch (err) {
      program.error(err)
    }
    process.exit(0)
  })
