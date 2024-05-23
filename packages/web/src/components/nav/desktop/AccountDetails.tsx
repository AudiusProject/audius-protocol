import { useIsManagedAccount } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'
import { accountSelectors } from '@audius/common/store'
import { Box, Flex, FlexProps, Text, useTheme } from '@audius/harmony'

import { AvatarLegacy } from 'components/avatar/AvatarLegacy'
import { TextLink, UserLink } from 'components/link'
import { useFlag } from 'hooks/useRemoteConfig'
import { useSelector } from 'utils/reducer'
import { SIGN_IN_PAGE, profilePage } from 'utils/route'

import { AccountSwitcher } from './AccountSwitcher/AccountSwitcher'
import { backgroundOverlay } from 'utils/styleUtils'

const { getAccountUser } = accountSelectors

const messages = {
  haveAccount: 'Have an Account?',
  managedAccount: 'Managed Account',
  signIn: 'Sign in'
}

export const AccountDetails = () => {
  const account = useSelector((state) => getAccountUser(state))
  const { color } = useTheme()
  const { isEnabled: isManagerModeEnabled = false } = useFlag(
    FeatureFlags.MANAGER_MODE
  )
  const isManagedAccount = useIsManagedAccount() && isManagerModeEnabled

  const profileLink = profilePage(account?.handle ?? '')

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
        pt='l'
        pr='s'
        pb='s'
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
        <Flex alignItems='center' w='100%' justifyContent='flex-start' gap='l'>
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
            {account ? (
              <>
                <Flex
                  alignItems='center'
                  justifyContent='space-between'
                  gap='l'
                >
                  <UserLink
                    textVariant='title'
                    size='s'
                    userId={account.user_id}
                    badgeSize='xs'
                    css={{
                      flex: 1,
                      ...(isManagedAccount && {
                        color: color.text.accent,
                        '&:hover': { color: color.text.accent }
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
                      color: color.text.accent,
                      '&:hover': { color: color.text.accent }
                    }
                  }
                >{`@${account.handle}`}</TextLink>
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
