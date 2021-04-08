import React, { useCallback } from 'react'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import { push as pushRoute } from 'connected-react-router'
import { matchPath } from 'react-router-dom'
import clsx from 'clsx'
import { ReactComponent as Logo } from 'assets/img/audiusLogoHorizontal.svg'

import { AppState } from 'store/types'
import styles from './MobileNav.module.css'
import * as routes from 'utils/routes'
import { Button, ButtonType, IconRemove } from '@audius/stems'
import useOpenLink from 'hooks/useOpenLink'

const messages = {
  launchApp: 'LAUNCH THE APP',
  name: 'PROTOCOL DASHBOARD'
}

const navRoutes = [
  { matchParams: { path: routes.HOME, exact: true }, text: 'OVERVIEW' },
  { matchParams: { path: routes.ANALYTICS, exact: true }, text: 'ANALYTICS' },
  { matchParams: { path: routes.SERVICES }, text: 'SERVICES' },
  { matchParams: { path: routes.GOVERNANCE }, text: 'GOVERNANCE' }
]

type MobileNavButtonProps = {
  matchParams: {
    path: string
    exact?: boolean
  }
  pathname: string
  text: string
  pushRoute: (path: string) => void
  onClose: () => void
}

const MobileNavButton = (props: MobileNavButtonProps) => {
  const {
    pushRoute,
    matchParams: { path },
    onClose
  } = props
  const isActiveRoute = !!matchPath(window.location.pathname, props.matchParams)
  const onButtonClick = useCallback(() => {
    onClose()
    pushRoute(path)
  }, [onClose, path, pushRoute])

  return (
    <Button
      text={props.text}
      type={ButtonType.GLASS}
      className={clsx(styles.navButton, { [styles.active]: isActiveRoute })}
      textClassName={clsx(styles.navButtonText)}
      onClick={onButtonClick}
    />
  )
}

type LaunchTheAppButtonProps = {}
const LaunchTheAppButton = (props: LaunchTheAppButtonProps) => {
  const goToApp = useOpenLink(routes.AUDIUS_DAPP_URL)
  return (
    <Button
      text={messages.launchApp}
      className={styles.launchAppBtn}
      textClassName={styles.launchAppBtnText}
      onClick={goToApp}
    />
  )
}

type OwnProps = {
  isOpen: boolean
  onClose: () => void
}

type MobileNavProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const MobileNav = ({
  pathname,
  pushRoute,
  isOpen,
  onClose
}: MobileNavProps) => (
  <div
    className={clsx(styles.container, {
      [styles.isOpen]: isOpen
    })}
  >
    <div className={styles.close} onClick={onClose}>
      <IconRemove />
    </div>
    <div className={styles.inner}>
      <div className={styles.top}>
        <Logo className={styles.logo} />
        <div className={styles.name}>{messages.name}</div>
      </div>
      {navRoutes.map(route => (
        <div key={route.text} className={styles.btnContainer}>
          <MobileNavButton
            {...route}
            onClose={onClose}
            pathname={pathname}
            pushRoute={pushRoute}
          />
        </div>
      ))}
      <LaunchTheAppButton />
    </div>
  </div>
)

const mapStateToProps = (state: AppState) => {
  return {
    pathname: state.router.location.pathname
  }
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    pushRoute: (path: string) => dispatch(pushRoute(path))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(MobileNav)
