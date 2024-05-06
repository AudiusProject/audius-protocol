import { useCallback, useMemo, useRef, useState } from 'react'

import {
  useGetCurrentUserId,
  useGetCurrentWeb3User,
  useGetManagedAccounts
} from '@audius/common/api'
import { Flex, IconButton, IconCaretDown, Popup } from '@audius/harmony'

import { AccountListContent } from './AccountListContent'
import { UserMetadata } from '@audius/common/models'
import { useAccountSwitcher } from '@audius/common/hooks'

export const AccountSwitcher = () => {
  const [isExpanded, setIsExpanded] = useState(false)

  const { data: currentWeb3User } = useGetCurrentWeb3User({})
  const { data: currentUserId } = useGetCurrentUserId({})

  const { switchAccount } = useAccountSwitcher()

  const onAccountSelected = useCallback((user: UserMetadata) => {
    switchAccount(user)
  }, [])

  const { data: managedAccounts = [] } = useGetManagedAccounts(
    { userId: currentWeb3User?.user_id! },
    { disabled: !currentWeb3User }
  )

  const parentElementRef = useRef<HTMLDivElement>(null)
  const onClickExpander = useCallback(
    () => setIsExpanded((expanded) => !expanded),
    []
  )

  const accounts = useMemo(() => {
    return managedAccounts.filter(({ grant }) => grant.is_approved)
  }, [managedAccounts])

  return !currentWeb3User || !currentUserId || accounts.length === 0 ? null : (
    <Flex
      ref={parentElementRef}
      direction='column'
      alignItems='center'
      justifyContent='flex-start'
      h='2xl'
      w='2xl'
    >
      <IconButton
        color='default'
        size='2xs'
        aria-label='Open Account Switcher'
        icon={IconCaretDown}
        onClick={onClickExpander}
      />
      <Popup
        checkIfClickInside={(target: EventTarget) => {
          if (target instanceof Element && parentElementRef.current) {
            return parentElementRef.current.contains(target)
          }
          return false
        }}
        anchorRef={parentElementRef}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        dismissOnMouseLeave={false}
        isVisible={isExpanded}
        onClose={() => setIsExpanded(false)}
      >
        <AccountListContent
          managerAccount={currentWeb3User}
          currentUserId={currentUserId!}
          onAccountSelected={onAccountSelected}
          accounts={accounts}
        />
      </Popup>
    </Flex>
  )
}
