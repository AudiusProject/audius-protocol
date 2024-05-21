import { FeatureFlags } from '@audius/common/services'
import { accountSelectors } from '@audius/common/store'
import { Box, Flex, Text } from '@audius/harmony'

import { AvatarLegacy } from 'components/avatar/AvatarLegacy'
import { TextLink, UserLink } from 'components/link'
import { useFlag } from 'hooks/useRemoteConfig'
import { useSelector } from 'utils/reducer'
import { SIGN_IN_PAGE, profilePage } from 'utils/route'

import { AccountSwitcher } from './AccountSwitcher/AccountSwitcher'
import { useIsManagedAccount } from '@audius/common/hooks'

const { getAccountUser } = accountSelectors

const messages = {
  haveAccount: 'Have an Account?',
  managedAccount: 'Managed Account',
  signIn: 'Sign in'
}

export const AccountDetails = () => {
  const account = useSelector((state) => getAccountUser(state))
  const { isEnabled: isManagerModeEnabled } = useFlag(FeatureFlags.MANAGER_MODE)
  const isManagedAccount = useIsManagedAccount()

  const profileLink = profilePage(account?.handle ?? '')

  return (
    <Flex direction='column' pb='unit5'>
      {isManagerModeEnabled && isManagedAccount ? (
        <Box pv='xs' ph='m' backgroundColor='accent'>
          <Text variant='label' size='xs' color='staticWhite'>
            {messages.managedAccount}
          </Text>
        </Box>
      ) : null}
      <Flex pt='l' pr='s' pb='s' pl='m'>
        <Flex alignItems='center' flex={0} gap='l'>
          <AvatarLegacy userId={account?.user_id} />
          <Flex
            direction='column'
            gap='xs'
            css={{
              textAlign: 'left',
              whiteSpace: 'nowrap',
              wordBreak: 'keep-all',
              overflow: 'hidden'
            }}
          >
            {account ? (
              <>
                <UserLink
                  textVariant='title'
                  size='s'
                  strength='weak'
                  userId={account.user_id}
                  badgeSize='xs'
                />
                <TextLink
                  textVariant='body'
                  size='xs'
                  to={profileLink}
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
                  textVariant='body'
                  size='xs'
                  strength='weak'
                >
                  {messages.signIn}
                </TextLink>
              </>
            )}
          </Flex>
          {isManagerModeEnabled && account ? (
            <Flex
              direction='column'
              alignItems='center'
              justifyContent='flex-start'
              h='100%'
            >
              <AccountSwitcher />
            </Flex>
          ) : null}
        </Flex>
      </Flex>
    </Flex>
  )
}
