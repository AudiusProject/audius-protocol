import React from 'react'

import { connect } from 'react-redux'

import { getIsReachable } from 'store/reachability/selectors'
import { AppState } from 'store/types'

import ReachabilityBarContainer from './components/ReachabilityBarContainer'

type ConnectedReachabilityBarProps = ReturnType<typeof mapStateToProps>

const ConnectedReachabilityBar = ({
  isReachable
}: ConnectedReachabilityBarProps) => {
  return <ReachabilityBarContainer isReachable={isReachable} />
}

function mapStateToProps(state: AppState) {
  return {
    isReachable: getIsReachable(state)
  }
}

export default connect(mapStateToProps)(ConnectedReachabilityBar)
