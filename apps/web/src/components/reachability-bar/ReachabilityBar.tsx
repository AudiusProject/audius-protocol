import { reachabilitySelectors } from '@audius/common'
import { connect } from 'react-redux'

import { AppState } from 'store/types'

import ReachabilityBarContainer from './components/ReachabilityBarContainer'
const { getIsReachable } = reachabilitySelectors

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
