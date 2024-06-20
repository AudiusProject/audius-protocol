import { useEffect } from 'react'

import { useDrawer } from 'app/hooks/useDrawer'
import { useRoute } from 'app/hooks/useRoute'

export const useShowManagerModeNotAvailable = () => {
  const { params } = useRoute()
  const path = (params as { path: string })?.path
  const { onOpen: openManagerModeDrawer } = useDrawer('ManagerMode')

  useEffect(() => {
    if (path === 'accounts-you-manage') {
      openManagerModeDrawer()
    }
  }, [path, openManagerModeDrawer])
}
