import { createServer } from "./server";
import { log } from "logger";
import App from "basekit/src/app"
import { Tracks } from "storage";

type SharedData = {}

const main = async () => {
  log("starting!")
  await new App<SharedData>({})
    .listen<Tracks>("tracks", async (app, msg) => {
      log(`received msg: ${JSON.stringify(msg)}`)
    })
    .run()
}

(async () => {
  await main().catch(log)
})()
