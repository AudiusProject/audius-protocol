import { IconLink } from '@audius/stems'
import Logo from 'assets/img/audiusLogoHorizontal.svg?react'
import BN from 'bn.js'
import clsx from 'clsx'
import Button from 'components/Button'
import { ConnectAudiusProfileModal } from 'components/ConnectAudiusProfileModal/ConnectAudiusProfileModal'
import ConnectMetaMaskModal from 'components/ConnectMetaMaskModal'
import DisplayAudio from 'components/DisplayAudio'
import { Position } from 'components/Tooltip'
import UserImage from 'components/UserImage'
import { useDashboardWalletUser } from 'hooks/useDashboardWalletUsers'
import React, { useCallback, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAccount } from 'store/account/hooks'
import { useEthBlockNumber } from 'store/cache/protocol/hooks'
import { useUser } from 'store/cache/user/hooks'
import { Address } from 'types'
import getActiveStake from 'utils/activeStake'
import { usePushRoute } from 'utils/effects'
import { formatShortWallet } from 'utils/format'
import { useIsMobile, useModalControls } from 'utils/hooks'
import { createStyles } from 'utils/mobile'
import { accountPage, isCryptoPage } from 'utils/routes'
import desktopStyles from './AppBar.module.css'
import mobileStyles from './AppBarMobile.module.css'

const env = import.meta.env.VITE_ENVIRONMENT
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
  profileAlt: 'User Profile',
  connectProfile: 'Connect Audius Profile'
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
  const activeStake = user ? getActiveStake(user) : new BN('0')

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

const ConnectAudiusProfileButton = ({ wallet }: { wallet: string }) => {
  const { isOpen, onClick, onClose } = useModalControls()
  return (
    <>
      <Button
        onClick={onClick}
        className={styles.launchAppBtn}
        textClassName={styles.launchAppBtnText}
        text={messages.connectProfile}
        leftIcon={<IconLink width={16} height={16} />}
        iconClassName={styles.launchAppBtnIcon}
      />
      <ConnectAudiusProfileModal
        wallet={wallet}
        isOpen={isOpen}
        onClose={onClose}
      />
    </>
  )
}

type AppBarProps = {}
const AppBar: React.FC<AppBarProps> = () => {
  const isMobile = useIsMobile()
  const { isLoggedIn, wallet } = useAccount()
  const { data: audiusProfileData } = useDashboardWalletUser(wallet)
  const hasConnectedAudiusAccount = audiusProfileData != null
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
          {hasConnectedAudiusAccount || !wallet || !isLoggedIn ? null : (
            <ConnectAudiusProfileButton wallet={wallet} />
          )}
        </div>
      )}
    </div>
  )
}

export default AppBar
