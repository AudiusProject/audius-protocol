import { useCallback, useMemo, useRef, useState } from 'react'

import { useGetManagedAccounts } from '@audius/common/api'
import { Flex, IconButton, IconCaretDown, Popup } from '@audius/harmony'

import { AccountListContent } from './AccountListContent'
import { useSelector } from 'react-redux'
import { accountSelectors } from '@audius/common/store'

export const AccountSwitcher = () => {
  const { data: managedAccounts = [] } = useGetManagedAccounts({})
  const [isExpanded, setIsExpanded] = useState(false)

  const managerAccount = useSelector(accountSelectors.getAccountUser)

  const parentElementRef = useRef<HTMLDivElement>(null)
  const onClickExpander = useCallback(
    () => setIsExpanded((expanded) => !expanded),
    []
  )

  const accounts = useMemo(() => {
    return managedAccounts.filter(({ grant }) => grant.is_approved)
  }, [managedAccounts])

  return managerAccount === null || accounts.length === 0 ? null : (
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
          managerAccount={managerAccount}
          accounts={accounts}
        />
      </Popup>
    </Flex>
  )
}
