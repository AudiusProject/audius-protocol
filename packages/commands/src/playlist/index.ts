import { Command } from '@commander-js/extra-typings'
import { createPlaylistCommand } from './create-playlist'
import { editPlaylistCommand } from './edit-playlist'
import { favoritePlaylistCommand } from './favorite-playlist'
import { repostPlaylistCommand } from './repost-playlist'
import { unfavoritePlaylistCommand } from './unfavorite-playlist'
import { unrepostPlaylistCommand } from './unrepost-playlist'
import { getPlaylistCommand } from './get-playlist'

export const playlistCommand = new Command('playlist')
  .description('Commands that create or target a specific playlist')
  .addCommand(createPlaylistCommand)
  .addCommand(editPlaylistCommand)
  .addCommand(favoritePlaylistCommand)
  .addCommand(getPlaylistCommand)
  .addCommand(repostPlaylistCommand)
  .addCommand(unfavoritePlaylistCommand)
  .addCommand(unrepostPlaylistCommand)
