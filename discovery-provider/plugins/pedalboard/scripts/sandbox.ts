/**
 * Sandbox file you can use to just test run an app!
 */

import App from "../src/app"

type Track = {}

const main = async () => {
    await new App()
        .repeat(3000, async (app) => console.log(`Repeat one: ${new Date().getTime()}`))
        .repeat(10000, async (app) => console.log(`Repeat two: ${new Date().getTime()}`))
        .scan() 
        .spawn(async (app) => console.log("spawned"))
        .run()
}

main()
