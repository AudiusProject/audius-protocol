import { Flex, IconUserArrowRotate, Text } from '@audius/harmony-native'
import { NativeDrawer } from 'app/components/drawer'
import { useDrawer } from 'app/hooks/useDrawer'

import { HarmonyModalHeader } from '../core/HarmonyModalHeader'

const messages = {
  managerModeNotAvailable:
    'Manager Mode is only available on Audius web & desktop apps.',
  managerModeNotAvailableTitle: 'Available On Web'
}

export const ManagerModeDrawer = () => {
  const { onClose: closeDrawer } = useDrawer('ManagerMode')

  return (
    <NativeDrawer drawerName='ManagerMode' onClose={closeDrawer}>
      <Flex w='100%' p='2xl' gap='xl'>
        <HarmonyModalHeader
          icon={IconUserArrowRotate}
          title={messages.managerModeNotAvailableTitle}
        />
        <Text variant='body' size='l'>
          {messages.managerModeNotAvailable}
        </Text>
      </Flex>
    </NativeDrawer>
  )
}
