import { Flex, IconTrophy, Text, useTheme } from '@audius/harmony-native'
import { DrawerHeader } from 'app/components/core/DrawerHeader'
import { NativeDrawer } from 'app/components/drawer'
import { useDrawer } from 'app/hooks/useDrawer'

const DRAWER_NAME = 'PickWinners'

const messages = {
  header: 'Pick Winners',
  description:
    'Launch a web browser on your computer to select the winners of your remix contest!'
}

export const PickWinnersDrawer = () => {
  const { onClose } = useDrawer(DRAWER_NAME)
  const { spacing } = useTheme()

  return (
    <NativeDrawer
      drawerName={DRAWER_NAME}
      onClose={onClose}
      drawerStyle={{
        paddingVertical: spacing.unit10,
        paddingHorizontal: spacing.l
      }}
    >
      <DrawerHeader title={messages.header} icon={IconTrophy} />
      <Flex pv='xl' mb='3xl'>
        <Text variant='body' size='l' textAlign='center'>
          {messages.description}
        </Text>
      </Flex>
    </NativeDrawer>
  )
}
