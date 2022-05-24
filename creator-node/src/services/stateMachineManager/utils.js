class StateMachineUtils {
  /**
   * @param {Object[]} nodeUserInfoList array of objects of schema { primary, secondary1, secondary2, user_id, wallet }
   * @returns {Set} Set of content node endpoint strings
   */
  static computeContentNodePeerSet(nodeUserInfoList, thisContentNodeEndpoint) {
    // Aggregate all nodes from user replica sets
    let peerList = nodeUserInfoList
      .map((userInfo) => userInfo.primary)
      .concat(nodeUserInfoList.map((userInfo) => userInfo.secondary1))
      .concat(nodeUserInfoList.map((userInfo) => userInfo.secondary2))

    peerList = peerList
      .filter(Boolean) // filter out false-y values to account for incomplete replica sets
      .filter((peer) => peer !== thisContentNodeEndpoint) // remove self from peerList

    const peerSet = new Set(peerList) // convert to Set to get uniques

    return peerSet
  }
}

module.exports = StateMachineUtils
