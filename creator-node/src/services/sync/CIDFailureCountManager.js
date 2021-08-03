/**
 * Tracks CID failure counts
 * Records in-memory, state reset with each node restart (this is ok)
 */
const CIDFailureCountManager = {
  // map of CID -> (int) failure count
  CIDFailureCounts: {},

  resetCIDFailureCount: (CID) => {
    CIDFailureCountManager.CIDFailureCounts[CID] = 0
  },

  incrementCIDFailureCount: (CID) => {
    if (CID in CIDFailureCountManager.CIDFailureCounts) {
      CIDFailureCountManager.CIDFailureCounts[CID] += 1
    } else {
      CIDFailureCountManager.CIDFailureCounts[CID] = 1
    }
  },

  getCIDFailureCount: (CID) => {
    return CIDFailureCountManager.CIDFailureCounts[CID] || 0
  }
}

module.exports = CIDFailureCountManager
