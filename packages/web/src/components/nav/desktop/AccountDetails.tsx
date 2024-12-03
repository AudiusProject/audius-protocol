import { useIsManagedAccount } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'
import { accountSelectors } from '@audius/common/store'
import { route } from '@audius/common/utils'
import { Box, Flex, Text, useTheme } from '@audius/harmony'

import { AvatarLegacy } from 'components/avatar/AvatarLegacy'
import { TextLink, UserLink } from 'components/link'
import { useFlag } from 'hooks/useRemoteConfig'
import { useSelector } from 'utils/reducer'
import { backgroundOverlay } from 'utils/styleUtils'

import { AccountSwitcher } from './AccountSwitcher/AccountSwitcher'

const { SIGN_IN_PAGE, profilePage } = route
const { getUserHandle, getUserId } = accountSelectors

const messages = {
  haveAccount: 'Have an Account?',
  managedAccount: 'Managed Account',
  signIn: 'Sign in'
}

export const AccountDetails = () => {
  const accountHandle = useSelector(getUserHandle)
  const accountUserId = useSelector(getUserId)
  console.log('asdf accountHandle', accountHandle)
  const { color } = useTheme()
  const { isEnabled: isManagerModeEnabled = false } = useFlag(
    FeatureFlags.MANAGER_MODE
  )
  const isManagedAccount = useIsManagedAccount() && isManagerModeEnabled

  const profileLink = profilePage(accountHandle ?? '')

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
          <AvatarLegacy userId={accountUserId ?? undefined} />
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
            {accountUserId ? (
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
                    userId={accountUserId}
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
                >{`@${accountHandle}`}</TextLink>
              </>
            ) : (
              <>
                <Text variant='body' size='s' strength='strong'>
                  {messages.haveAccount}
                </Text>
                <TextLink
                  to={SIGN_IN_PAGE}
                  variant='visible'
                  size='xs'
                  strength='weak'
                >
                  {messages.signIn}
                </TextLink>
              </>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
