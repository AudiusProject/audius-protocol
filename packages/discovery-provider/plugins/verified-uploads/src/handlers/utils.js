// takes in a table, entity id, and blocknumber. traverses the block for the previous
// state of this entity should it be in there
export const getPreviousState = async ({ table, id, blocknumber, db }) => {
  const block = await db('revert_blocks')
    .where('blocknumber', '=', blocknumber)
    .first()

  if (block === undefined) return

  const { prev_records } = block

  const previousStates = prev_records[table]
  if (previousStates === undefined) return

  // bot only handles tracks and users rn
  const pkeyKey = table === 'users' ? 'user_id' : 'track_id'
  return previousStates.find((update) => update[pkeyKey] === id)
}
