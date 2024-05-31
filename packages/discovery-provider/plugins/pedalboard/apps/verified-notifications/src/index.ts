import { log } from '@pedalboard/logger'
import { App, initializeDiscoveryDb } from '@pedalboard/basekit'
import { Tracks, Users } from '@pedalboard/storage'
import { userRowHandler } from './users'
import { trackRowHandler } from './tracks'

type SharedData = object

export const discoveryDb = initializeDiscoveryDb()

new App<SharedData>({})
    .listen<Tracks>('tracks', trackRowHandler)
    .listen<Users>('users', userRowHandler)
    .run()
    .catch((e: unknown) => {
        if (e instanceof Error) {
            console.error({
                message: e.message,
                name: e.name,
                stack: e.stack,
                error: e,
            }, "fatal error")
        } else if (typeof e === "object" && e !== null) {
            console.error({
                message: (e as { message?: string }).message,
                name: (e as { name?: string }).name,
                stack: (e as { stack?: string }).stack,
                error: e,
            }, "fatal error")
        } else {
            console.error({
                error: e,
            }, "fatal error")
        }

        process.exit(1)
    })
