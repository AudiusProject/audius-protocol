import { useCallback } from 'react'
import { useMatch } from 'react-router-dom'
import clsx from 'clsx'
import Logo from 'assets/img/audiusLogoHorizontal.svg?react'
import { useNavigate, useLocation } from 'react-router-dom'

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
  { matchParams: { path: `${routes.SERVICES}*` }, text: 'SERVICES' },
  { matchParams: { path: `${routes.GOVERNANCE}*` }, text: 'GOVERNANCE' }
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
  const isActiveRoute = !!useMatch(props.matchParams)
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

type MobileNavProps = {
  isOpen: boolean
  onClose: () => void
}

const MobileNav = ({ isOpen, onClose }: MobileNavProps) => {
  const location = useLocation()
  const navigate = useNavigate()

  return (
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
              pathname={location.pathname}
              pushRoute={path => navigate(path)}
            />
          </div>
        ))}
        <LaunchTheAppButton />
      </div>
    </div>
  )
}

export default MobileNav
