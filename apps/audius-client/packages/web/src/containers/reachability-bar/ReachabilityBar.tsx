import React from 'react'
import ReachabilityBarContainer from './components/ReachabilityBarContainer'
import { AppState } from 'store/types'
import { getIsReachable } from 'store/reachability/selectors'
import { connect } from 'react-redux'

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
