import React, { useState, useCallback } from 'react'
import Button from 'components/Button'
import { Position } from 'components/Tooltip'
import ConnectMetaMaskModal from 'components/ConnectMetaMaskModal'
import { ReactComponent as Logo } from 'assets/img/audiusLogoHorizontal.svg'
import { useAccount } from 'store/account/hooks'
import { useUser } from 'store/cache/user/hooks'
import { Address } from 'types'
import { formatShortWallet } from 'utils/format'
import { usePushRoute } from 'utils/effects'
import { accountPage, AUDIUS_DAPP_URL, isCryptoPage } from 'utils/routes'
import { useEthBlockNumber } from 'store/cache/protocol/hooks'
import clsx from 'clsx'
import { useLocation } from 'react-router-dom'
import { createStyles } from 'utils/mobile'
import desktopStyles from './AppBar.module.css'
import mobileStyles from './AppBarMobile.module.css'
import { useIsMobile } from 'utils/hooks'
import DisplayAudio from 'components/DisplayAudio'
import UserImage from 'components/UserImage'
import useOpenLink from 'hooks/useOpenLink'
import getActiveStake from 'utils/activeStake'
import { Utils } from '@audius/libs'

const styles = createStyles({ desktopStyles, mobileStyles })

const messages = {
  title: 'AUDIUS',
  name: 'PROTOCOL DASHBOARD',
  launchApp: 'LAUNCH THE APP',
  connectMetaMask: 'Connect Metamask',
  metaMaskMisconfigured: 'Metamask Misconfigured',
  block: 'Block',
  wallet: 'WALLET',
  staked: 'STAKED',
  profileAlt: 'User Profile'
}

// TODO:
// * Replace account img, wallet & tokens from store
type UserAccountSnippetProps = { wallet: Address }
type MisconfiguredProps = {
  isAccountMisconfigured: boolean
  isMisconfigured: boolean
}

const Misconfigured = ({
  isAccountMisconfigured,
  isMisconfigured
}: MisconfiguredProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const onClick = useCallback(() => setIsOpen(true), [setIsOpen])
  const onClose = useCallback(() => setIsOpen(false), [setIsOpen])

  const onClickHandler = isMisconfigured ? undefined : onClick
  return (
    <>
      <div
        onClick={onClickHandler}
        className={clsx(styles.connectMetaMaskContainer, {
          [styles.misconfigured]: isMisconfigured
        })}
      >
        <div className={styles.connectMetaMaskDot}></div>
        <div className={styles.connectMetaMask}>
          {isMisconfigured
            ? messages.metaMaskMisconfigured
            : messages.connectMetaMask}
        </div>
      </div>
      <ConnectMetaMaskModal isOpen={isOpen} onClose={onClose} />
    </>
  )
}

const UserAccountSnippet = ({ wallet }: UserAccountSnippetProps) => {
  const { user } = useUser({ wallet })
  const activeStake = user ? getActiveStake(user) : Utils.toBN('0')

  const pushRoute = usePushRoute()
  const onClickUser = useCallback(() => {
    if (user) {
      pushRoute(accountPage(user.wallet))
    }
  }, [user, pushRoute])

  if (!user) return null

  return (
    <div className={styles.snippetContainer} onClick={onClickUser}>
      <div className={styles.user}>
        <UserImage
          wallet={user.wallet}
          imgClassName={styles.snippetImg}
          alt={messages.profileAlt}
          useSkeleton={false}
        />
        <div className={styles.walletText}>
          {formatShortWallet(user.wallet)}
        </div>
      </div>
      <div className={styles.snippetText}>
        <DisplayAudio
          position={Position.BOTTOM}
          className={styles.tokenText}
          amount={user.audToken}
          shortFormat
        />
        <p className={styles.userSnippetLabel}>{messages.wallet}</p>
      </div>
      <div className={styles.snippetText}>
        <DisplayAudio
          position={Position.BOTTOM}
          className={styles.tokenText}
          amount={activeStake}
          shortFormat
        />
        <p className={styles.userSnippetLabel}>{messages.staked}</p>
      </div>
    </div>
  )
}

type LaunchTheAppButtonProps = {}
const LaunchTheAppButton = (props: LaunchTheAppButtonProps) => {
  const goToApp = useOpenLink(AUDIUS_DAPP_URL)
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

  const { isMisconfigured, isAccountMisconfigured } = window.aud

  return (
    <div className={styles.appBar}>
      <div className={styles.left}>
        <Logo className={styles.logo} />
        <div className={styles.name}>{messages.name}</div>
        <div
          className={clsx(styles.currentBlock, {
            [styles.show]: showBlock
          })}
        >
          <div className={styles.block}>{ethBlock}</div>
          <div className={styles.title}>{messages.block}</div>
        </div>
      </div>
      {!isMobile && (
        <div className={styles.right}>
          <div className={styles.userAccountSnippetContainer}>
            {isMisconfigured || isAccountMisconfigured ? (
              <Misconfigured
                isMisconfigured={isMisconfigured}
                isAccountMisconfigured={isAccountMisconfigured}
              />
            ) : (
              isLoggedIn && wallet && <UserAccountSnippet wallet={wallet} />
            )}
          </div>
          <LaunchTheAppButton />
        </div>
      )}
    </div>
  )
}

export default AppBar
