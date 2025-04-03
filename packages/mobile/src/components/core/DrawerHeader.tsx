import type { IconComponent } from '@audius/harmony-native'
import { Flex, Text } from '@audius/harmony-native'

type DrawerHeaderProps = {
  icon: IconComponent
  title: string
}

export const DrawerHeader = ({ icon: Icon, title }: DrawerHeaderProps) => {
  return (
    <Flex
      row
      w='100%'
      justifyContent='center'
      alignItems='center'
      gap='s'
      pb='l'
      borderBottom='default'
    >
      <Icon color='subdued' size='m' />
      <Text strength='strong' variant='label' color='subdued' size='xl'>
        {title}
      </Text>
    </Flex>
  )
}
