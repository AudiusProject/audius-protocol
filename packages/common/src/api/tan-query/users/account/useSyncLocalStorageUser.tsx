import { PropsWithChildren, useEffect } from 'react'

import { useCurrentAccountUser } from '~/api'
import { LocalStorage } from '~/services'

export const useSyncLocalStorageUser = (localStorage: LocalStorage) => {
  const { data: accountUser } = useCurrentAccountUser()

  useEffect(() => {
    if (accountUser) {
      localStorage.setAudiusAccountUser(accountUser)
    }
  }, [accountUser, localStorage])
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
