import chalk from "chalk";
import { program } from "commander";

import { initializeAudiusLibs } from "./utils.mjs";

program.command("edit-playlist")
  .description("Update an existing playlist")
  .argument("<playlistId>", "id of playlist to update")
  .option("-n, --name <name>", "Name of playlist")
  .option("-d, --description <description>", "Description of playlist")
  .option("-f, --from <from>", "The account to edit the track from")
  .option("-v, --visibility <visibility>", "Change visibility of the collection")
  .action(async (playlistId, { name, description, from, visibility }) => {
    const audiusLibs = await initializeAudiusLibs(from);
    try {
      const playlist = (await audiusLibs.Playlist.getPlaylists(100, 0, [playlistId]))[0]
      delete playlist.user
      console.log(chalk.yellow.bold("Playlist before update: "), playlist);

      const response = await audiusLibs.EntityManager.updatePlaylist(
        {
          ...playlist,
          playlist_name: name || playlist.playlist_name,
          description: description || playlist.description,
          is_private: visibility !== undefined ? visibility === 'hidden' : playlist.is_private
        }
      );

      if (response.error) {
        program.error(chalk.red(response.error));
      }

      await new Promise(r => setTimeout(r, 2000));

      const updatedPlaylist = (await audiusLibs.Playlist.getPlaylists(100, 0, [playlistId]))[0]
      delete updatedPlaylist.user
      console.log(chalk.green("Successfully updated playlist!"));
      console.log(chalk.yellow.bold("Playlist after update: "), updatedPlaylist);
    } catch (err) {
      program.error(err.message);
    }

    process.exit(0);
  });
