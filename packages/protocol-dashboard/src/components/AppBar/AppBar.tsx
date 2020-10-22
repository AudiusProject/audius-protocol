import React, { useState, useCallback } from 'react'
import Button from 'components/Button'
import Tooltip, { Position } from 'components/Tooltip'
import ConnectMetaMaskModal from 'components/ConnectMetaMaskModal'
import { ReactComponent as Logo } from 'assets/img/audiusLogoHorizontal.svg'
import { useAccount } from 'store/account/hooks'
import { useUser } from 'store/cache/user/hooks'
import { Address, Status } from 'types'
import { formatWei, formatShortAud, formatShortWallet } from 'utils/format'
import { usePushRoute } from 'utils/effects'
import { accountPage, isCryptoPage } from 'utils/routes'
import { useEthBlockNumber } from 'store/cache/protocol/hooks'
import clsx from 'clsx'
import { useLocation } from 'react-router-dom'
import { TICKER } from 'utils/consts'
import { createStyles } from 'utils/mobile'
import desktopStyles from './AppBar.module.css'
import mobileStyles from './AppBarMobile.module.css'
import { useIsMobile } from 'utils/hooks'

const styles = createStyles({ desktopStyles, mobileStyles })

const messages = {
  title: 'AUDIUS',
  name: 'PROTOCOL DASHBOARD',
  launchApp: 'LAUNCH THE APP',
  connectMetaMask: 'Connect Metamask',
  block: 'Block'
}

// TODO:
// * Replace account img, wallet & tokens from store
type UserAccountSnippetProps = { wallet: Address }

const UserAccountSnippet = ({ wallet }: UserAccountSnippetProps) => {
  const { user, status } = useUser({ wallet })
  const [isOpen, setIsOpen] = useState(false)
  const onClick = useCallback(() => setIsOpen(true), [setIsOpen])
  const onClose = useCallback(() => setIsOpen(false), [setIsOpen])
  const pushRoute = usePushRoute()
  const onClickUser = useCallback(() => {
    if (user) {
      pushRoute(accountPage(user.wallet))
    }
  }, [user, pushRoute])

  if (!user || status !== Status.Success) {
    return (
      <>
        <div onClick={onClick} className={styles.connectMetaMaskContainer}>
          <div className={styles.connectMetaMaskDot}></div>
          <div className={styles.connectMetaMask}>
            {messages.connectMetaMask}
          </div>
        </div>
        <ConnectMetaMaskModal isOpen={isOpen} onClose={onClose} />
      </>
    )
  }

  return (
    <div className={styles.snippetContainer} onClick={onClickUser}>
      <img src={user.image} className={styles.snippetImg} alt="User Profile" />
      <div className={styles.snippetText}>
        <div className={styles.walletText}>
          {formatShortWallet(user.wallet)}
        </div>
        <Tooltip
          position={Position.BOTTOM}
          text={formatWei(user.audToken)}
          className={styles.tokenText}
        >
          {`${formatShortAud(user.audToken)} ${TICKER}`}
        </Tooltip>
      </div>
    </div>
  )
}

type LaunchTheAppButtonProps = {}
const LaunchTheAppButton = (props: LaunchTheAppButtonProps) => {
  const goToApp = useCallback(
    () => window.open('https://audius.co', '_blank'),
    []
  )
  return (
    <Button
      text={messages.launchApp}
      className={styles.launchAppBtn}
      textClassName={styles.launchAppBtnText}
      onClick={goToApp}
    />
  )
}

type AppBarProps = {}
const AppBar: React.FC<AppBarProps> = (props: AppBarProps) => {
  const isMobile = useIsMobile()
  const { isLoggedIn, wallet } = useAccount()
  const ethBlock = useEthBlockNumber()
  const { pathname } = useLocation()
  const showBlock = isCryptoPage(pathname) && ethBlock
  return (
    <div className={styles.appBar}>
      <div className={styles.left}>
        <Logo className={styles.logo} />
        <div className={styles.name}>{messages.name}</div>
      </div>
      {!isMobile && (
        <div className={styles.right}>
          <div
            className={clsx(styles.currentBlock, {
              [styles.show]: showBlock
            })}
          >
            <div className={styles.title}>{messages.block}</div>
            <div className={styles.block}>{ethBlock}</div>
          </div>
          {isLoggedIn && wallet && (
            <div className={styles.userAccountSnippetContainer}>
              <UserAccountSnippet wallet={wallet} />
            </div>
          )}
          <LaunchTheAppButton />
        </div>
      )}
    </div>
  )
}

export default AppBar
