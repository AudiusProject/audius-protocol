// takes in a table, entity id, and blocknumber. traverses the block for the previous

import { App } from "@pedalboard/basekit"
import { Table } from "@pedalboard/storage"

// state of this entity should it be in there
export const getPreviousState = async (app: App<object>, { table, id, blocknumber }: { table: string, id: number, blocknumber: number }) => {
    const discoveryDb = app.getDnDb()
    const block = await discoveryDb(Table.RevertBlocks)
        .where('blocknumber', '=', blocknumber)
        .first()

    if (block === undefined) return

    const { prev_records } = block

    const previousStates = prev_records[table]
    if (previousStates === undefined) return

    // bot only handles tracks and users rn
    const pkeyKey = table === 'users' ? 'user_id' : 'track_id'
    return previousStates.find((update: { [x: string]: number }) => update[pkeyKey] === id)
}

export const logError = (e: unknown, msg: string) => {
    if (e instanceof Error) {
        console.error({
            message: e.message,
            name: e.name,
            stack: e.stack,
            error: e,
        }, msg)
    } else if (typeof e === "object" && e !== null) {
        console.error({
            message: (e as { message?: string }).message,
            name: (e as { name?: string }).name,
            stack: (e as { stack?: string }).stack,
            error: e,
        }, msg)
    } else {
        console.error({
            error: e,
        }, msg)
    }
}
