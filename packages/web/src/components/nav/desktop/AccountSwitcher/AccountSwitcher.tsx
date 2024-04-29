import { useGetManagedAccounts } from '@audius/common/api'
import { useAudiusQueryContext } from '@audius/common/audius-query'
import { IconButton, IconCaretDown } from '@audius/harmony'
import { useEffect, useState } from 'react'

export const AccountSwitcher = () => {
  const { data: managedAccounts } = useGetManagedAccounts({})
  const onClickExpander = () => {}

  console.log(managedAccounts)

  return managedAccounts && managedAccounts.length ? (
    <IconButton
      color='default'
      size='s'
      aria-label='Open Account Switcher'
      icon={IconCaretDown}
      onClick={onClickExpander}
    />
  ) : null
}
