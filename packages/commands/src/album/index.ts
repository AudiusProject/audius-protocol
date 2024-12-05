import { Command } from '@commander-js/extra-typings'
import { purchaseAlbumCommand } from './purchase-album'

export const albumCommand = new Command('album')
  .description('Commands that create or target a specific album')
  .addCommand(purchaseAlbumCommand)
