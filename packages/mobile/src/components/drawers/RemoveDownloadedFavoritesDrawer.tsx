import { useCallback } from 'react'

import { useDispatch } from 'react-redux'

import { requestRemoveAllDownloadedFavorites } from 'app/store/offline-downloads/slice'

import { ConfirmationDrawer } from './ConfirmationDrawer'

const messages = {
  header: 'Are You Sure?',
  description:
    'Are you sure you want to remove all of your downloaded favorites?',
  confirm: 'Remove All Downloads'
}

const drawerName = 'RemoveDownloadedFavorites'

export const RemoveDownloadedFavoritesDrawer = () => {
  const dispatch = useDispatch()

  const handleConfirm = useCallback(() => {
    dispatch(requestRemoveAllDownloadedFavorites())
  }, [dispatch])

  return (
    <ConfirmationDrawer
      drawerName={drawerName}
      messages={messages}
      onConfirm={handleConfirm}
    />
  )
}
