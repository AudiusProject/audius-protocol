import { Knex } from "knex";
import { logger } from "../logger";
import { convertToCSV, writeCSVToFile } from "../utils/csv";
import { formatDate } from "../utils/date";

export type ClientLabelMetadata = {
    UniqueTrackIdentifier: number;
    TrackTitle: string;
    Artist: string;
    AlbumTitle: string;
    AlbumId: number;
    ReleaseLabel: string;
    ISRC: string;
    UPC: string | null;
    Composer: string;
    Duration: number;
    ResourceType: string;
  }
  
  export const reportMRIData = async (db: Knex, date: Date) => {
      logger.info("beginning report processing")
  
      const trackRows = await queryClientLabelMetadataForDay(db, date)
  
      logger.info({ len: trackRows.length })
  
      const csvData = convertToCSV(trackRows)
      writeCSVToFile(csvData, `./output/Audius_CLM_${formatDate(date)}.csv`)
  }

// queries for client label metadata within 24 hours of the given date
export const queryClientLabelMetadataForDay = async (db: Knex, date: Date): Promise<ClientLabelMetadata[]> => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0)

    const end = new Date(date);
    end.setHours(23, 59, 59, 999)

    return queryClientLabelMetadataRange(db, start, end)
}

export const queryClientLabelMetadataRange = async (db: Knex, start: Date, end: Date): Promise<ClientLabelMetadata[]> => {
    logger.info({ start: start.toISOString(), end: end.toISOString() }, "gather records in range")
    const trackRows: ClientLabelMetadata[] = await db('tracks')
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
            `tracks.track_id as UniqueTrackIdentifier`,
            `tracks.title as TrackTitle`,
            `users.name as Artist`,
            `playlists.playlist_name as AlbumTitle`,
            `playlists.playlist_id as AlbumId`,
            db.raw(`'' as "ReleaseLabel"`),
            `tracks.isrc as ISRC`,
            `playlists.upc as UPC`,
            db.raw(`'' as "Composer"`),
            `tracks.duration as Duration`,
            db.raw(`'Audio' as "ResourceType"`)
        )
        .whereNotNull('playlists.playlist_id')
        .whereNotNull('isrc')
        .andWhereNot('isrc', '=', '')
        .where('tracks.created_at', '>=', start)
        .where('tracks.created_at', '<', end)

        return trackRows
}
