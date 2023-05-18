import App from "./app"

type Track = {}
type Playlist = {}
type Notif = {}

const main = async () => {
    const app = new App(/** CONFIG */)
        .listen<Track>("tracks", async (self: App, msg: Track) => { /** Handle Track Messages */ })
        /** validate would check the type of message first, dlq would preserve the message on error */
        .listen<Playlist>("playlists", async (self: App, msg: Playlist) => { /** Handle Playlists Messages */ })
        .repeat(10000, async (self: App) => { /** Some cron job */ })
        .run(async (self: App) => { /** Express Rest Server */ })
        .run(async (self: App) => { /** GraphQL Server */ })
}

Promise.allSettled([main]).catch(console.error)
