import { Command } from '@commander-js/extra-typings'
import { purchaseAlbumCommand } from './purchase-album'
import { createAlbumCommand } from './create-album'
import { getAlbumCommand } from './get-album'

export const albumCommand = new Command('album')
  .description('Commands that create or target a specific album')
  .addCommand(createAlbumCommand)
  .addCommand(getAlbumCommand)
  .addCommand(purchaseAlbumCommand)
