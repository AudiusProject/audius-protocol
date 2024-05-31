import { App } from "@pedalboard/basekit";
import { Tracks } from "@pedalboard/storage";
import { discoveryDb } from ".";
import { sendSlackMsg } from "./slack";

const TRACKS_SLACK_CHANNEL = process.env.TRACKS_SLACK_CHANNEL

const onNewTrackRow = async (trackRow: Tracks) => {
    const { track_id, updated_at, created_at } = trackRow
    const isUpload =
        updated_at === created_at &&
        updated_at !== undefined &&
        created_at !== undefined
    if (!isUpload) return

    const trackId = track_id
    const results = await discoveryDb('tracks')
        .innerJoin('users', 'tracks.owner_id', '=', 'users.user_id')
        .innerJoin('track_routes', 'tracks.track_id', '=', 'track_routes.track_id')
        .select(
            'tracks.title',
            'tracks.mood',
            'tracks.genre',
            'tracks.release_date',
            'tracks.is_stream_gated',
            'tracks.is_download_gated',
            'tracks.owner_id',
            'users.user_id',
            'users.handle',
            'users.name',
            'tracks.track_id',
            'users.is_verified',
            'track_routes.slug',
            'tracks.is_unlisted'
        )
        .where('tracks.track_id', '=', trackId)
        .where('users.is_verified', '=', true)
        .whereNull('tracks.stem_of')
        .where('tracks.is_unlisted', '=', false)
        .first()
        .catch(console.error)

    if (results === undefined) return

    const { title, genre, mood, is_stream_gated, is_download_gated, handle, slug, release_date, name } =
        results

    const header = `:audius-spin: New upload from *${name}* 🔥`
    const data = {
        Title: title,
        Genre: genre,
        Mood: mood,
        'Stream Gated': is_stream_gated,
        'Download Gated': is_download_gated,
        Handle: handle,
        Link: `https://audius.co/${handle}/${slug}`,
        Release: release_date || created_at
    }
    console.log({ to_slack: data }, 'track upload')
    await sendSlackMsg(TRACKS_SLACK_CHANNEL, header, data).catch(console.error)
}

export const trackRowHandler = async (app: App<object>, trackRow: Tracks) => {
    try {
        await onNewTrackRow(trackRow)
    } catch (e: unknown) {
        if (e instanceof Error) {
            console.error({
                message: e.message,
                name: e.name,
                stack: e.stack,
                error: e,
            }, "track event error")
        } else if (typeof e === "object" && e !== null) {
            console.error({
                message: (e as { message?: string }).message,
                name: (e as { name?: string }).name,
                stack: (e as { stack?: string }).stack,
                error: e,
            }, "track event error")
        } else {
            console.error({
                error: e,
            }, "track event error")
        }
    }
}
