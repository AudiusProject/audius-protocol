import { useGetCurrentUser } from '@audius/common/api'
import { useIsManagedAccount } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'
import { Box, Flex, Text, useTheme } from '@audius/harmony'

import { AvatarLegacy } from 'components/avatar/AvatarLegacy'
import { TextLink, UserLink } from 'components/link'
import { useFlag } from 'hooks/useRemoteConfig'
import { SIGN_IN_PAGE, SIGN_UP_PAGE, profilePage } from 'utils/route'
import { backgroundOverlay } from 'utils/styleUtils'

import { AccountSwitcher } from './AccountSwitcher/AccountSwitcher'

const messages = {
  haveAccount: 'Have an Account?',
  managedAccount: 'Managed Account',
  signIn: 'Sign in'
}

export const AccountDetails = () => {
  const { data: account } = useGetCurrentUser({})
  const { color } = useTheme()
  const { isEnabled: isManagerModeEnabled = false } = useFlag(
    FeatureFlags.MANAGER_MODE
  )
  const isManagedAccount = useIsManagedAccount() && isManagerModeEnabled

  const profileLink = profilePage(account?.handle ?? '')
  const isGuestAccount = account?.handle === 'guest'

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
        <Flex alignItems='center' w='100%' justifyContent='flex-start' gap='s'>
          <AvatarLegacy userId={account?.user_id} />
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
            {account && !isGuestAccount ? (
              <>
                <Flex
                  alignItems='center'
                  justifyContent='space-between'
                  gap='s'
                  h={20}
                >
                  <UserLink
                    textVariant='title'
                    size='s'
                    userId={account.user_id}
                    badgeSize='xs'
                    css={{
                      flex: 1,
                      ...(isManagedAccount && {
                        color: color.secondary.s500,
                        '&:hover': { color: color.secondary.s500 }
                      })
                    }}
                  />
                  {isManagerModeEnabled ? <AccountSwitcher /> : null}
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
                >{`@${account.handle}`}</TextLink>
              </>
            ) : (
              <>
                <Text variant='body' size='s' strength='strong'>
                  {isGuestAccount ? 'Guest' : messages.haveAccount}
                </Text>
                <TextLink
                  to={isGuestAccount ? SIGN_UP_PAGE : SIGN_IN_PAGE}
                  variant='visible'
                  size='xs'
                  strength='weak'
                >
                  {isGuestAccount ? 'Complete You Account' : messages.signIn}
                </TextLink>
              </>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
