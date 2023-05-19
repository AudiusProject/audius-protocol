/**
 * Sandbox file you can use to just test run an app!
 */

import App from "../src/app"
import { Table } from "../src/models"

const main = async () => {
    await new App()
        .repeat(3000, async (app) => console.log(`Repeat one: ${new Date().getTime()}`))
        .repeat(10000, async (app) => console.log(`Repeat two: ${new Date().getTime()}`))
        .scan(Table.Users, async (self, row) => {}) 
        .spawn(async (app) => console.log("spawned"))
        .run()
}

main()
