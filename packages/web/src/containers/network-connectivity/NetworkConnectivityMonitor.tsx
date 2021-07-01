import React, { useState, useEffect } from 'react'

import { connect } from 'react-redux'

import NoConnectivityContent from 'components/no-connectivity-page/NoConnectivityContent'
import { getIsReachable } from 'store/reachability/selectors'
import { AppState } from 'store/types'

type NetworkConnectivityMonitorProps = {
  children: JSX.Element
  pageDidLoad: boolean
  onDidRegainConnectivity?: () => void
} & ReturnType<typeof mapStateToProps>

/**
 * Component which wraps a child component in a network-connectivity aware
 * container. If connectivity checks fail, it displays a no-internet
 * error screen.
 *
 * **Subtle behavior alert:**
 *  - If there is no connectivity at component mount, we always show the error screen.
 *  - If we've mounted but haven't fully loaded (`pageDidLoad`) and then lose connectivity,
 *  we show the error screen.
 *  - If we've mounted, loaded, and then lose connectivity, we *don't* show the error screen.
 */
const NetworkConnectivityMonitor = ({
  children,
  isReachable,
  pageDidLoad,
  onDidRegainConnectivity = () => {}
}: NetworkConnectivityMonitorProps) => {
  const [didMount, setDidMount] = useState(false)
  const [shouldShowChildren, setShouldShowChildren] = useState(true)

  useEffect(() => {
    if (isReachable === false) {
      // If we're unreachable and either haven't mounted, or the
      // page hasn't fully loaded yet, don't show children.
      if (!didMount || !pageDidLoad) {
        setShouldShowChildren(false)
      }
    } else if (!shouldShowChildren) {
      // If we're reachable ever, show children
      setShouldShowChildren(true)
      onDidRegainConnectivity()
    }

    if (!didMount) {
      setDidMount(true)
    }
  }, [
    isReachable,
    didMount,
    pageDidLoad,
    onDidRegainConnectivity,
    shouldShowChildren
  ])

  return shouldShowChildren ? children : <NoConnectivityContent />
}

function mapStateToProps(state: AppState) {
  return {
    isReachable: getIsReachable(state)
  }
}

export default connect(mapStateToProps)(NetworkConnectivityMonitor)
