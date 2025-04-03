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
      justifyContent='center'
      alignItems='center'
      gap='2xs'
      pb='xs'
      borderBottom='default'
    >
      <Icon fill='subdued' height={20} width={24} />
      <Text strength='strong' variant='label' color='subdued' size='xl'>
        {title}
      </Text>
    </Flex>
  )
}
