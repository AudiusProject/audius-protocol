import { useCallback, useMemo, useRef, useState } from 'react'

import {
  useGetCurrentUserId,
  useGetCurrentWeb3User,
  useGetManagedAccounts
} from '@audius/common/api'
import { useAccountSwitcher } from '@audius/common/hooks'
import { UserMetadata } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { Box, IconButton, IconCaretDown, Popup } from '@audius/harmony'
import { useSelector } from 'react-redux'

import { AccountListContent } from './AccountListContent'

export const AccountSwitcher = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const userId = useSelector(accountSelectors.getUserId)

  const { data: currentWeb3User } = useGetCurrentWeb3User(
    {},
    { disabled: !userId }
  )
  const { data: currentUserId } = useGetCurrentUserId({}, { disabled: !userId })

  const { switchAccount } = useAccountSwitcher()

  const onAccountSelected = useCallback(
    (user: UserMetadata) => {
      switchAccount(user)
    },
    [switchAccount]
  )

  const web3UserId = currentWeb3User?.user_id ?? null

  const { data: managedAccounts = [] } = useGetManagedAccounts(
    { userId: web3UserId! },
    { disabled: !web3UserId }
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
    <Box ref={parentElementRef}>
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
        css={{
          overflow: 'hidden'
        }}
      >
        <AccountListContent
          managerAccount={currentWeb3User}
          currentUserId={currentUserId!}
          onAccountSelected={onAccountSelected}
          accounts={accounts}
        />
      </Popup>
    </Box>
  )
}
