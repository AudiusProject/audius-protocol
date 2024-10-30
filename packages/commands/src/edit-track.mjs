import chalk from 'chalk'
import { program } from 'commander'

import { initializeAudiusLibs } from './utils.mjs'

program
  .command('edit-track')
  .description('Update an existing track')
  .argument('<trackId>', 'Id of track to update')
  .option('-t, --title <title>', 'Title of track')
  .option('-a, --tags <tags>', 'Tags of track')
  .option('-d, --description <description>', 'Description of track')
  .option('-m, --mood <mood>', 'Mood of track')
  .option('-g, --genre <genre>', 'Genre of track')
  .option(
    '-s, --preview-start-seconds <seconds>',
    'Track preview start time (seconds)',
    null
  )
  .option('-l, --license <license>', 'License of track')
  .option('-f, --from <from>', 'The account to edit the track from')
  .option(
    '-r, --stream-conditions <stream conditions>',
    'The stream conditions object; sets track as stream gated',
    ''
  )
  .option('-v, --visibility <visibility>', 'Change track visibility')
  .option('-x, --remixOf <remixOf>', 'Set the original track of this remix')
  .action(
    async (
      trackId,
      {
        title,
        tags,
        description,
        mood,
        genre,
        previewStartSeconds,
        license,
        from,
        streamConditions,
        visibility,
        remixOf
      }
    ) => {
      const audiusLibs = await initializeAudiusLibs(from)
      try {
        const track = (await audiusLibs.Track.getTracks(100, 0, [trackId]))[0]
        delete track.user
        console.log(chalk.yellow.bold('Track before update: '), track)

        const updatedMetadata = {
          ...track,
          title: title || track.title,
          tags: tags || track.tags,
          description: description || track.description,
          mood: mood || track.mood,
          genre: genre || track.genre,
          license: license || track.license,
          is_stream_gated: streamConditions ? true : track.is_stream_gated,
          stream_conditions: streamConditions
            ? JSON.parse(streamConditions)
            : track.stream_conditions,
          preview_start_seconds: previewStartSeconds
            ? parseInt(previewStartSeconds)
            : track.preview_start_seconds,
          is_unlisted: visibility ? visibility === 'hidden' : track.is_unlisted,
          remix_of:
            remixOf !== undefined
              ? { tracks: [{ parent_track_id: parseInt(remixOf) }] }
              : track.remix_of
        }

        const transcodePreview =
          previewStartSeconds != null &&
          track.preview_start_seconds != parseInt(previewStartSeconds)
        const response = await audiusLibs.Track.updateTrackV2(
          audiusLibs.getCurrentUser().user_id,
          updatedMetadata,
          transcodePreview
        )

        if (response.error) {
          program.error(chalk.red(response.error))
        }

        await new Promise((r) => setTimeout(r, 2000))

        const updatedTrack = (
          await audiusLibs.Track.getTracks(100, 0, [trackId])
        )[0]
        delete updatedTrack.user
        console.log(chalk.green('Successfully updated track!'))
        console.log(chalk.yellow.bold('Track after update: '), updatedTrack)
      } catch (err) {
        program.error(err.message)
      }

      process.exit(0)
    }
  )
