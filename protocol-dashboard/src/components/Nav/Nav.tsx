import { useCallback } from 'react'
import { matchPath, useNavigate, useLocation } from 'react-router-dom'
import clsx from 'clsx'

import styles from './Nav.module.css'
import * as routes from 'utils/routes'
import { Button, ButtonType } from '@audius/stems'

const navRoutes = [
  {
    baseRoute: routes.HOME,
    matchParams: [{ path: routes.HOME, exact: true }],
    text: 'OVERVIEW'
  },
  {
    baseRoute: routes.ANALYTICS,
    matchParams: [
      { path: routes.ANALYTICS, exact: true },
      { path: routes.API }
    ],
    text: 'ANALYTICS'
  },
  {
    baseRoute: routes.SERVICES,
    matchParams: [{ path: `${routes.SERVICES}*` }],
    text: 'SERVICES'
  },
  {
    baseRoute: routes.GOVERNANCE,
    matchParams: [{ path: `${routes.GOVERNANCE}*` }],
    text: 'GOVERNANCE'
  }
]

type NavButtonProps = {
  matchParams: {
    path: string
    exact?: boolean
  }[]
  baseRoute: string
  pathname: string
  text: string
  pushRoute: (path: string) => void
}

const NavButton = (props: NavButtonProps) => {
  const { pushRoute, baseRoute } = props
  const location = useLocation()

  const isActiveRoute = props.matchParams.some(
    matchParam => !!matchPath(matchParam, location.pathname)
  )
  const onButtonClick = useCallback(() => pushRoute(baseRoute), [
    baseRoute,
    pushRoute
  ])

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

const Nav = () => {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <div className={styles.container}>
      {navRoutes.map(route => (
        <div key={route.text} className={styles.btnContainer}>
          <NavButton
            {...route}
            pathname={location.pathname}
            pushRoute={path => navigate(path)}
          />
        </div>
      ))}
    </div>
  )
}

export default Nav
