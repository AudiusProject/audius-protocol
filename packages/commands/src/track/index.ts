import { Command } from '@commander-js/extra-typings'
import { editTrackCommand } from './edit-track'
import { favoriteTrackCommand } from './favorite-track'
import { getTrackCommand } from './get-track'
import { purchaseTrackCommand } from './purchase-track'
import { repostTrackCommand } from './repost-track'
import { unfavoriteTrackCommand } from './unfavorite-track'
import { unrepostTrackCommand } from './unrepost-track'
import { uploadTrackCommand } from './upload-track'

export const trackCommand = new Command('track')
  .description('Commands that create or target a specific track')
  .addCommand(editTrackCommand)
  .addCommand(favoriteTrackCommand)
  .addCommand(getTrackCommand)
  .addCommand(purchaseTrackCommand)
  .addCommand(repostTrackCommand)
  .addCommand(unfavoriteTrackCommand)
  .addCommand(unrepostTrackCommand)
  .addCommand(uploadTrackCommand)
