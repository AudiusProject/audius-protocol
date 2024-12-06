import chalk from 'chalk'
import { Command } from '@commander-js/extra-typings'
import { initializeAudiusSdk, getCurrentUserId } from '../utils'

export const purchaseTrackCommand = new Command('purchase')
  .description('Buys a track using USDC')
  .argument('<trackId>', 'The track ID')
  .argument('<price>', 'The expected price of the track', parseFloat)
  .option('-f, --from <from>', 'The account purchasing the content (handle)')
  .option(
    '-e, --extra-amount <amount>',
    'Extra amount to pay in addition to the price (in dollars)',
    parseFloat
  )
  .action(async (trackId, price, { from, extraAmount }) => {
    const audiusSdk = await initializeAudiusSdk({
      handle: from
    })
    const userId = await getCurrentUserId()

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
  })
