/**
 * Sandbox file you can use to just test run an app!
 */

import App from "../src/app"
import { Table, Tracks, Users } from "../src/models"
import { server } from "./server"

export type SharedData = {
    userUpdateCount: number,
    trackUpdateCount: number,
    counterCount: number,
}

const main = async () => {

    await new App<SharedData>({
        userUpdateCount: 0,
        trackUpdateCount: 0,
        counterCount: 0,
    })
        .listen<Tracks>("tracks", async (app, msg) => {
            console.log(`got track update! ${JSON.stringify(msg)}`)
            app.updateAppData((data) => {
                return {
                    ...data,
                    trackUpdateCount: data.trackUpdateCount += 1,
                }
            })
        })
        .listen<Users>("users", async (app, msg) => {
            console.log(`got user update! ${JSON.stringify(msg)}`)
            app.updateAppData((data) => {
                return {
                    ...data,
                    userUpdateCount: data.userUpdateCount += 1,
                }
            })
        })
        .repeat(10000, async (app) => {
            app.updateAppData((data) => {
                return {
                    ...data,
                    counterCount: data.counterCount += 1,
                }
            })
        })
        .scan(Table.Tracks, async (app, row) => { })
        .spawn(server)
        .run()
}

main()
