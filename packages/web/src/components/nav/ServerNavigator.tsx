import { Client } from '@audius/common/models'
import cn from 'classnames'
import { RouteComponentProps, withRouter } from 'react-router-dom'

import { useIsMobile } from 'hooks/useIsMobile'
import { getClient } from 'utils/clientUtil'

import styles from './Navigator.module.css'

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
    />
  )
}

export default withRouter(ServerNavigator)
