import { useEffect, useState } from 'react'

import { GUEST_EMAIL, useIsManagedAccount } from '@audius/common/hooks'
import { accountSelectors } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { Box, Flex, Text, useTheme } from '@audius/harmony'
import { useLocalStorage } from 'react-use'

import { Avatar } from 'components/avatar/Avatar'
import { TextLink, UserLink } from 'components/link'
import { useSelector } from 'utils/reducer'
import { backgroundOverlay } from 'utils/styleUtils'

import { AccountSwitcher } from './AccountSwitcher/AccountSwitcher'

const { SIGN_IN_PAGE, SIGN_UP_PAGE, profilePage } = route
const { getUserHandle, getUserId, getIsAccountComplete } = accountSelectors
const messages = {
  haveAccount: 'Have an Account?',
  managedAccount: 'Managed Account',
  signIn: 'Sign in',
  finishSignUp: 'Finish Signing Up'
}

type AccountDetailsContainerProps = {
  children: React.ReactNode
  isManagedAccount?: boolean
}

const AccountDetailsContainer = ({
  children,
  isManagedAccount
}: AccountDetailsContainerProps) => {
  const { color } = useTheme()
  return (
    <Flex direction='column' pb='unit5' w='100%'>
      {isManagedAccount ? (
        <Box pv='xs' ph='m' backgroundColor='accent'>
          <Text variant='label' size='xs' color='staticWhite'>
            {messages.managedAccount}
          </Text>
        </Box>
      ) : null}
      <Flex
        pv='s'
        pr='s'
        pl='m'
        {...(isManagedAccount
          ? {
              borderBottom: 'strong',
              css: {
                ...backgroundOverlay({
                  color: color.background.accent,
                  opacity: 0.03
                })
              }
            }
          : undefined)}
      >
        {children}
      </Flex>
    </Flex>
  )
}

type AccountContentWrapperProps = {
  children: React.ReactNode
}

const AccountContentWrapper = ({ children }: AccountContentWrapperProps) => (
  <Flex alignItems='center' w='100%' justifyContent='flex-start' gap='s'>
    {children}
  </Flex>
)

type AccountInfoProps = {
  children: React.ReactNode
}

const AccountInfo = ({ children }: AccountInfoProps) => (
  <Flex
    direction='column'
    gap='xs'
    flex={1}
    css={{
      textAlign: 'left',
      whiteSpace: 'nowrap',
      wordBreak: 'keep-all',
      overflow: 'hidden'
    }}
  >
    {children}
  </Flex>
)

type SignedInViewProps = {
  userId: number
  handle: string
  isManagedAccount: boolean
}

const SignedInView = ({
  userId,
  handle,
  isManagedAccount
}: SignedInViewProps) => {
  const { color } = useTheme()
  const profileLink = profilePage(handle)

  return (
    <AccountContentWrapper>
      <Avatar userId={userId} h={48} w={48} />
      <AccountInfo>
        <Flex alignItems='center' justifyContent='space-between' gap='s' h={20}>
          <UserLink
            textVariant='title'
            size='s'
            userId={userId}
            badgeSize='xs'
            css={{
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              wordBreak: 'break-word',
              ...(isManagedAccount && {
                color: color.secondary.s500,
                '&:hover': { color: color.secondary.s500 }
              })
            }}
          />
          <AccountSwitcher />
        </Flex>
        <TextLink
          size='s'
          to={profileLink}
          css={
            isManagedAccount && {
              color: color.secondary.s500,
              '&:hover': { color: color.secondary.s500 }
            }
          }
        >{`@${handle}`}</TextLink>
      </AccountInfo>
    </AccountContentWrapper>
  )
}

const SignedOutView = () => (
  <AccountContentWrapper>
    <Avatar userId={null} h={48} w={48} />
    <AccountInfo>
      <Text variant='title' size='s'>
        {messages.haveAccount}
      </Text>
      <TextLink to={SIGN_IN_PAGE} variant='visible' size='s'>
        {messages.signIn}
      </TextLink>
    </AccountInfo>
  </AccountContentWrapper>
)

const GuestView = () => {
  const [guestEmailFromLocalStorage] = useLocalStorage(GUEST_EMAIL, '')

  const [guestEmail, setGuestEmail] = useState(guestEmailFromLocalStorage)

  useEffect(() => {
    // Listen for changes to the guest email in local storage
    function listenForStorage() {
      const storedGuestEmail = localStorage.getItem(GUEST_EMAIL)
      if (storedGuestEmail) {
        setGuestEmail(JSON.parse(storedGuestEmail))
      }
    }
    window.addEventListener(GUEST_EMAIL, listenForStorage)
    return () => {
      window.removeEventListener(GUEST_EMAIL, listenForStorage)
    }
  }, [])
  return (
    <AccountContentWrapper>
      <Avatar userId={null} h={48} w={48} />
      <AccountInfo>
        <Text variant='title' size='s' ellipses>
          {guestEmail}
        </Text>
        <TextLink to={SIGN_UP_PAGE} variant='visible' size='s'>
          {messages.finishSignUp}
        </TextLink>
      </AccountInfo>
    </AccountContentWrapper>
  )
}

export const AccountDetails = () => {
  const accountHandle = useSelector(getUserHandle)
  const accountUserId = useSelector(getUserId)
  const isManagedAccount = useIsManagedAccount()
  const hasCompletedAccount = useSelector(getIsAccountComplete)
  const [guestEmail] = useLocalStorage(GUEST_EMAIL, '')

  // Determine which state to show
  if (accountUserId && accountHandle) {
    return (
      <AccountDetailsContainer isManagedAccount={isManagedAccount}>
        <SignedInView
          userId={accountUserId}
          handle={accountHandle}
          isManagedAccount={isManagedAccount}
        />
      </AccountDetailsContainer>
    )
  }

  if (!hasCompletedAccount && guestEmail) {
    return (
      <AccountDetailsContainer>
        <GuestView />
      </AccountDetailsContainer>
    )
  }

  return (
    <AccountDetailsContainer>
      <SignedOutView />
    </AccountDetailsContainer>
  )
}
