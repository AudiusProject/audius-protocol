import { Divider, Flex, IconComponent, Text } from '@audius/harmony'

type ProfilePageNavSectionTitleProps = {
  title: string
  Icon: IconComponent
}

export const ProfilePageNavSectionTitle = ({
  title,
  Icon
}: ProfilePageNavSectionTitleProps) => (
  <Flex alignItems='center' gap='s'>
    <Icon size='m' color='default' />
    <Text variant='title' size='s'>
      {title}
    </Text>
    <Divider color='default' />
  </Flex>
)
