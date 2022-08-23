type ReplicaSet = {
  primary?: string
  secondary1?: string
  secondary2?: string
}

/**
 * Converts a string of endpoints to a ReplicaSet type.
 * @param {string} replicaSetStr The comma-separated string of endpoints like:
 *                      "http://cn_primary.co,http://cn_secondary1.co,http://cn_secondary2.co"
 * @return {ReplicaSet} a ReplicaSet type of the string split by comma, where the first index is the primary and the other 2 indexes are secondaries
 */
function strToReplicaSet(replicaSetStr: string): ReplicaSet {
  const replicaSetArr = replicaSetStr.split(',')
  if (replicaSetArr?.length !== 3) {
    throw new Error(`Expected 3 replicas in array but got: ${replicaSetArr}`)
  }
  return {
    primary: replicaSetArr[0],
    secondary1: replicaSetArr[1],
    secondary2: replicaSetArr[2]
  }
}

export default strToReplicaSet
export type { ReplicaSet }
