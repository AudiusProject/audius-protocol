import React from 'react'

import cn from 'classnames'
import { connect } from 'react-redux'
import { RouteComponentProps, withRouter } from 'react-router-dom'

import Client from 'models/Client'
import { AppState } from 'store/types'
import { getClient } from 'utils/clientUtil'

import styles from './Navigator.module.css'
import NavColumn from './desktop/NavColumn'
import ConnectedNavBar from './mobile/ConnectedNavBar'

interface OwnProps {
  className?: string
}

type NavigatorProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  RouteComponentProps

const Navigator: React.FC<NavigatorProps> = ({ className }) => {
  const client = getClient()

  const isMobile = client === Client.MOBILE

  return (
    <div
      className={cn(styles.navWrapper, className, {
        [styles.navColumnWrapper]: !isMobile
      })}
    >
      {isMobile ? (
        <ConnectedNavBar />
      ) : (
        <NavColumn isElectron={client === Client.ELECTRON} />
      )}
    </div>
  )
}

function mapStateToProps(state: AppState) {
  return {}
}

export default withRouter(connect(mapStateToProps)(Navigator))
