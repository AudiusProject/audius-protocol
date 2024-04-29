import { useGetManagedAccounts } from '@audius/common/api'
import { IconButton, IconCaretDown } from '@audius/harmony'

export const AccountSwitcher = () => {
  const { data: managedAccounts } = useGetManagedAccounts({})
  const onClickExpander = () => {}

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
