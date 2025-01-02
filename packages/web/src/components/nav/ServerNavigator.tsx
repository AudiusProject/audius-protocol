import { Client } from '@audius/common/models'
import cn from 'classnames'

import { useIsMobile } from 'hooks/useIsMobile'
import { getClient } from 'utils/clientUtil'
import { withRouter, RouteComponentProps } from 'utils/withRouter'

import styles from './Navigator.module.css'
import { ServerNavBar } from './mobile/ServerNavBar'

interface OwnProps {
  className?: string
}

type NavigatorProps = OwnProps & RouteComponentProps

// Navigation component that renders the NavBar for mobile
// and LeftNav for desktop
const ServerNavigator = ({ className }: NavigatorProps) => {
  const client = getClient()
  const isMobile = useIsMobile()

  const isElectron = client === Client.ELECTRON

  return (
    <div
      className={cn(styles.navWrapper, styles.serverWrapper, className, {
        [styles.leftNavWrapper]: !isMobile,
        [styles.isElectron]: isElectron
      })}
    >
      {isMobile ? <ServerNavBar /> : null}
    </div>
  )
}

export default withRouter(ServerNavigator)
