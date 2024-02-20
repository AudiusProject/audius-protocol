import { Box, Text, useTheme, HarmonyTheme } from '@audius/harmony'
import { IconLink } from '@audius/stems'
import { IconAudiusLogoHorizontal } from '@audius/harmony'
import BN from 'bn.js'
import clsx from 'clsx'
import Button from 'components/Button'
import { ConnectAudiusProfileModal } from 'components/ConnectAudiusProfileModal/ConnectAudiusProfileModal'
import ConnectMetaMaskModal from 'components/ConnectMetaMaskModal'
import UserImage from 'components/UserImage'
import UserBadges from 'components/UserInfo/AudiusProfileBadges'
import { useDashboardWalletUser } from 'hooks/useDashboardWalletUsers'
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import { useAccount } from 'store/account/hooks'
import { useUser } from 'store/cache/user/hooks'
import { Address, Status } from 'types'
import getActiveStake from 'utils/activeStake'
import { usePushRoute } from 'utils/effects'
import { formatShortWallet } from 'utils/format'
import { useIsMobile, useModalControls } from 'utils/hooks'
import { createStyles } from 'utils/mobile'
import { accountPage } from 'utils/routes'
import desktopStyles from './AppBar.module.css'
import mobileStyles from './AppBarMobile.module.css'

const env = import.meta.env.VITE_ENVIRONMENT
const styles = createStyles({ desktopStyles, mobileStyles })

const messages = {
  title: 'AUDIUS',
  name: 'Protocol Dashboard',
  launchApp: 'LAUNCH THE APP',
  connectMetaMask: 'Connect Metamask',
  metaMaskMisconfigured: 'Metamask Misconfigured',
  block: 'Block',
  wallet: 'WALLET',
  staked: 'STAKED',
  profileAlt: 'User Profile',
  connectProfile: 'Connect Audius Profile',
  loading: 'Loading Account...'
}

// TODO:
// * Replace account img, wallet & tokens from store
type UserAccountSnippetProps = { wallet: Address }
type MisconfiguredProps = {
  isMisconfigured: boolean
}

const Misconfigured = ({ isMisconfigured }: MisconfiguredProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const onClick = useCallback(() => setIsOpen(true), [setIsOpen])
  const onClose = useCallback(() => setIsOpen(false), [setIsOpen])

  return (
    <>
      <div
        onClick={onClick}
        className={clsx(styles.connectMetaMaskContainer, styles.cursorPointer)}
      >
        <div className={styles.connectMetaMaskDot}></div>
        <div className={styles.connectMetaMask}>
          {isMisconfigured
            ? messages.metaMaskMisconfigured
            : messages.connectMetaMask}
        </div>
      </div>
      <ConnectMetaMaskModal
        isMisconfigured={isMisconfigured}
        isOpen={isOpen}
        onClose={onClose}
      />
    </>
  )
}

const LoadingAccount = () => {
  return (
    <div className={styles.connectMetaMaskContainer}>
      <div className={clsx(styles.connectMetaMask, styles.loadingText)}>
        {messages.loading}
      </div>
    </div>
  )
}

const UserAccountSnippet = ({ wallet }: UserAccountSnippetProps) => {
  const { user, audiusProfile, status } = useUser({ wallet })
  const activeStake = user ? getActiveStake(user) : new BN('0')
  const pushRoute = usePushRoute()
  const onClickUser = useCallback(() => {
    if (user) {
      pushRoute(accountPage(user.wallet))
    }
  }, [user, pushRoute])

  if (status === Status.Loading) {
    return <LoadingAccount />
  }
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
        {audiusProfile != null ? null : (
          <div className={styles.walletText}>
            {formatShortWallet(user.wallet)}
          </div>
        )}
      </div>
      {audiusProfile == null ? null : (
        <div className={styles.userNameContainer}>
          <div className={styles.userNameText}>
            {audiusProfile.name}{' '}
            <UserBadges inline audiusProfile={audiusProfile} badgeSize={14} />
          </div>
          <div className={styles.walletText}>
            {formatShortWallet(user.wallet)}
          </div>
        </div>
      )}
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
        action="connect"
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
  const timeoutIdRef = useRef<NodeJS.Timeout>(null)
  const { spacing, color } = useTheme() as HarmonyTheme // Need to cast because the type from import is incorrect
  const [isAudiusClientSetup, setIsAudiusClientSetup] = useState(false)
  const [isMisconfigured, setIsMisconfigured] = useState(false)
  const [
    isRetrievingAccountTimingOut,
    setIsRetrievingAccountTimingOut
  ] = useState(false)
  const [isAccountMisconfigured, setIsAccountMisconfigured] = useState(false)
  const {
    data: audiusProfileData,
    status: audiusProfileDataStatus
  } = useDashboardWalletUser(wallet)
  const hasConnectedAudiusAccount = audiusProfileData != null

  const waitForSetup = async () => {
    timeoutIdRef.current = setTimeout(() => {
      if (!isAudiusClientSetup) {
        setIsRetrievingAccountTimingOut(true)
      }
    }, 11000)

    // This will hang forever if an extension is not picked (in the case where user has
    // both Phantom and MetaMask), hence the `retrievingAccountTimeOut` logic
    const account = await window.aud.metaMaskAccountLoadedPromise
    setIsAudiusClientSetup(true)
    setIsRetrievingAccountTimingOut(false)
    setIsMisconfigured(window.aud.isMisconfigured)
    setIsAccountMisconfigured(window.aud.isAccountMisconfigured)
  }

  useEffect(() => {
    waitForSetup()
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
      }
    }
  }, [])

  let accountSnippetContent: ReactNode
  let isAccountSnippetContentClickable: boolean
  if (
    (!isAudiusClientSetup && isRetrievingAccountTimingOut) ||
    (isAudiusClientSetup && (isMisconfigured || isAccountMisconfigured))
  ) {
    isAccountSnippetContentClickable = true
    accountSnippetContent = <Misconfigured isMisconfigured={isMisconfigured} />
  } else if (isLoggedIn && wallet) {
    isAccountSnippetContentClickable = true
    accountSnippetContent = <UserAccountSnippet wallet={wallet} />
  } else if (window.ethereum) {
    isAccountSnippetContentClickable = false
    accountSnippetContent = <LoadingAccount />
  } else {
    isAccountSnippetContentClickable = false
    accountSnippetContent = null
  }

  return (
    <div className={styles.appBar}>
      <div className={styles.left}>
        <IconAudiusLogoHorizontal color="staticWhite" className={styles.logo} />
        <Box
          h={spacing['2xl']}
          css={{
            borderRight: `solid 1px ${color.static.white}`,
            opacity: '80%'
          }}
        />
        <div className={styles.name}>
          <Text
            variant="heading"
            size="s"
            strength="default"
            color="staticWhite"
          >
            {messages.name}
          </Text>
        </div>
      </div>
      {!isMobile && (
        <div className={styles.right}>
          {hasConnectedAudiusAccount ||
          !wallet ||
          !isLoggedIn ||
          audiusProfileDataStatus === 'pending' ? null : (
            <ConnectAudiusProfileButton wallet={wallet} />
          )}
          <div
            className={clsx({
              [styles.cursorPointer]: isAccountSnippetContentClickable
            })}
          >
            {accountSnippetContent}
          </div>
        </div>
      )}
    </div>
  )
}

export default AppBar
