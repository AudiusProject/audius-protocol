class App { }

type Track = {}
type User = {}
type Playlist = {}
type Notif = {}

const main = async () => {
    const app = new App(/** CONFIG */)
    app.config({
        db: { /** Knex config */ },
        health: { /** verbose or not */ }
    })
        .listen<Track>("tracks", async (self: App, msg: Track) => { /** Handle Track Messages */ })
        /** validate would check the type of message first, dlq would preserve the message on error */
        .listen<User>({ validate: true, deadLetterQueue: false }, "users", async (self: App, msg: User) => { /** Handle User Messages */ })
        .listen<Playlist>("playlists", async (self: App, msg: Playlist) => { /** Handle Playlists Messages */ })
        .walk<Notif>("notifications", async (self: App, msg: Notif) => { /** Handle Notification Rows */ })
        .repeat(10000, async (self: App, msg: Notif) => { /** Some cron job */ })
        .run(async (self: App) => { /** Express Rest Server */ })
        .run(async (self: App) => { /** GraphQL Server */ })
}

Promise.allSettled([main]).catch(console.error)
