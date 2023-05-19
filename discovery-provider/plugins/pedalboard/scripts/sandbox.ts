/**
 * Sandbox file you can use to just test run an app!
 */

import App from "../src/app"
import { Table, Tracks, Users } from "../src/models"
import { server } from "../src/server"

const main = async () => {
    await new App()
        .listen<Tracks>("tracks", async (_app, msg) => {
            console.log(`got track update! ${JSON.stringify(msg)}`)
        })
        .listen<Users>("users", async (_app, msg) => {
            console.log(`got user update! ${JSON.stringify(msg)}`)
        })
        .repeat(3000, async (app) => console.log('PING'))
        .repeat(10000, async (app) => console.log(`PONG`))
        .scan(Table.Tracks, async (app, row) => { })
        .spawn(server)
        .run()
}

main()
