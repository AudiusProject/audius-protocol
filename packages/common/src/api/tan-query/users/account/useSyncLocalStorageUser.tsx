import { PropsWithChildren, useEffect } from 'react'

import { useCurrentAccount, useCurrentAccountUser } from '~/api'
import { LocalStorage } from '~/services'

export const useSyncLocalStorageUser = (localStorage: LocalStorage) => {
  const { data: accountUser } = useCurrentAccountUser()
  const { data: account } = useCurrentAccount()

  useEffect(() => {
    if (accountUser) {
      localStorage.setAudiusAccountUser(accountUser)
    }
  }, [accountUser, localStorage])

  useEffect(() => {
    if (account) {
      localStorage.setAudiusAccount(account)
    }
  }, [account, localStorage])
}

export const SyncLocalStorageUserProvider = ({
  children,
  localStorage
}: PropsWithChildren<{
  localStorage: LocalStorage
}>) => {
  useSyncLocalStorageUser(localStorage)
  return <>{children}</>
}
