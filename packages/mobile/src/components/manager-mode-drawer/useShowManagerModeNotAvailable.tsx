import { useEffect } from 'react'

import { useDrawer } from 'app/hooks/useDrawer'

import { useRoute } from 'app/hooks/useRoute'

export const useShowManagerModeNotAvailable = () => {
  const { params } = useRoute()
  const { onOpen: openManagerModeDrawer } = useDrawer('ManagerMode')
  useEffect(() => {
    if ((params as { path: string })?.path === 'accounts-you-manage') {
      openManagerModeDrawer()
    }
  }, [(params as { path: string })?.path])
}
