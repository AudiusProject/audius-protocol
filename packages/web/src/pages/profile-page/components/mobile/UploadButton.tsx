import { useCallback, useState } from 'react'

import { Button, Flex, IconCloudUpload } from '@audius/harmony'

import { DownloadMobileAppDrawer } from 'components/download-mobile-app-drawer/DownloadMobileAppDrawer'

const UploadButton = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const handleDrawerClose = useCallback(() => {
    setIsDrawerOpen(false)
  }, [setIsDrawerOpen])

  const handleClick = useCallback(() => {
    setIsDrawerOpen(true)
  }, [setIsDrawerOpen])

  return (
    <Flex pv='s' ph='m'>
      <Button
        variant='tertiary'
        onClick={handleClick}
        iconLeft={IconCloudUpload}
        fullWidth
      >
        Upload Track
      </Button>
      <DownloadMobileAppDrawer
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
      />
    </Flex>
  )
}

export default UploadButton
