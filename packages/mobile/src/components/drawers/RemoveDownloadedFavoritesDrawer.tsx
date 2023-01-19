import { removeAllDownloadedFavorites } from 'app/services/offline-downloader'

import { ConfirmationDrawer } from './ConfirmationDrawer'

const messages = {
  header: 'Are You Sure?',
  description:
    'Are you sure you want to remove all of your downloaded favorites?',
  confirm: 'Remove All Downloads'
}

const drawerName = 'RemoveDownloadedFavorites'

export const RemoveDownloadedFavoritesDrawer = () => {
  return (
    <ConfirmationDrawer
      drawerName={drawerName}
      messages={messages}
      onConfirm={removeAllDownloadedFavorites}
    />
  )
}
