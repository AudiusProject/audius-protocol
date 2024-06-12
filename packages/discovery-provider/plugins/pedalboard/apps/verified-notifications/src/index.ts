import { App, initializeDiscoveryDb } from "@pedalboard/basekit";
import { Tracks, Users } from "@pedalboard/storage";
import { trackRowHandler } from "./track";
import { userRowHandler } from "./users";
import { logError } from "./utils";

type SharedData = object

new App<SharedData>({})
    .listen<Tracks>('tracks', trackRowHandler)
    .listen<Users>('users', userRowHandler)
    .run()
    .catch((e: unknown) => {
        logError(e, "fatal error")
        process.exit(1)
    })
