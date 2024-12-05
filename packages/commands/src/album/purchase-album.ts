import chalk from 'chalk'
import { Command } from '@commander-js/extra-typings'

import { getCurrentUserId, initializeAudiusSdk } from '../utils.js'

export const purchaseAlbumCommand = new Command('purchase-album')
  .description('Buys an album using USDC')
  .argument('<albumId>', 'The album ID')
  .argument('<price>', 'The expected price of the album', parseFloat)
  .option('-f, --from <from>', 'The account purchasing the content (handle)')
  .option(
    '-e, --extra-amount <amount>',
    'Extra amount to pay in addition to the price (in dollars)',
    parseFloat
  )
  .action(async (albumId, price, { from, extraAmount }) => {
    const audiusSdk = await initializeAudiusSdk({
      handle: from
    })
    const userId = await getCurrentUserId()

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
  })
