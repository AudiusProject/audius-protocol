import { Knex } from "knex";
import { logger as plogger } from "./logger";
import { Table, Tracks } from '@pedalboard/storage'
import { convertToCSV } from "./csv";

export const reportMRIData = async (db: Knex, date: Date) => {
    const logger = plogger.child({ date: date.toISOString() })
    logger.info("beginning report processing")

    // get all track rows
    const trackRows = await db(Table.Tracks)
        .join(
            'users',
            'tracks.owner_id', '=', 'users.user_id'
        )
        .leftJoin('playlist_tracks', 'tracks.track_id', '=', 'playlist_tracks.track_id')
        .leftJoin('playlists', function () {
            this.on('playlist_tracks.playlist_id', '=', 'playlists.playlist_id')
            .andOn('playlists.is_album', '=', db.raw('true'))
        })
        .distinctOn('tracks.track_id')
        .select(
            `tracks.track_id as "UniqueTrackIdentifier"`,
            `tracks.title as "TrackTitle"`,
            `users.name as "Artist"`,
            `playlists.playlist_name as "AlbumTitle"`,
            `playlists.playlist_id as "AlbumId"`,
            db.raw(`'' as "ReleaseLabel"`),
            `tracks.isrc as "ISRC"`,
            `playlists.upc as "UPC"`,
            db.raw(`'' as "Composer"`),
            `tracks.duration as "Duration"`,
            db.raw(`'Audio' as "ResourceType"`)
        )
        .whereNotNull('playlists.playlist_id')
        .whereNotNull('isrc')
        .limit(10)

    convertToCSV(trackRows)
}
