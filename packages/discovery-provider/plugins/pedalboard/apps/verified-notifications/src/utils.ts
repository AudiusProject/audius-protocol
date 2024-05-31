// takes in a table, entity id, and blocknumber. traverses the block for the previous

import { Table } from "@pedalboard/storage"
import { discoveryDb } from "."

// state of this entity should it be in there
export const getPreviousState = async ({ table, id, blocknumber }: { table: string, id: number, blocknumber: number }) => {
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
