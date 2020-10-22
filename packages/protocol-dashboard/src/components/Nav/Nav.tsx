import React, { useCallback } from 'react'
import { Dispatch } from 'redux'
import { connect } from 'react-redux'
import { push as pushRoute } from 'connected-react-router'
import { matchPath } from 'react-router-dom'
import clsx from 'clsx'

import { AppState } from 'store/types'
import styles from './Nav.module.css'
import * as routes from 'utils/routes'
import { Button, ButtonType } from '@audius/stems'

const navRoutes = [
  { matchParams: { path: routes.HOME, exact: true }, text: 'OVERVIEW' },
  { matchParams: { path: routes.ANALYTICS, exact: true }, text: 'ANALYTICS' },
  { matchParams: { path: routes.SERVICES }, text: 'SERVICES' },
  { matchParams: { path: routes.GOVERNANCE }, text: 'GOVERNANCE' }
]

type NavButtonProps = {
  matchParams: {
    path: string
    exact?: boolean
  }
  pathname: string
  text: string
  pushRoute: (path: string) => void
}

const NavButton = (props: NavButtonProps) => {
  const {
    pushRoute,
    matchParams: { path }
  } = props
  const isActiveRoute = !!matchPath(window.location.pathname, props.matchParams)
  const onButtonClick = useCallback(() => pushRoute(path), [path, pushRoute])

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

type OwnProps = {}

type NavProps = OwnProps &
  ReturnType<typeof mapStateToProps> &
  ReturnType<typeof mapDispatchToProps>

const Nav = (props: NavProps) => (
  <div className={styles.container}>
    {navRoutes.map(route => (
      <div key={route.text} className={styles.btnContainer}>
        <NavButton
          {...route}
          pathname={props.pathname}
          pushRoute={props.pushRoute}
        />
      </div>
    ))}
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

export default connect(mapStateToProps, mapDispatchToProps)(Nav)
