import { Flex, Text, Link } from 'components'
import type { IconComponent } from 'components/typography/Icons/Icon'

type LockupProps = {
  icon: IconComponent
  subtitle: string
  description: string
  link?: string
}

export const Lockup = (props: LockupProps) => {
  const { icon: Icon, subtitle, description, link } = props
  return (
    <Flex direction='column' p='xl' gap='xl' border='strong' flex='1'>
      <Icon size='large' />
      <Flex direction='column' gap='s'>
        <Text variant='heading'>{subtitle}</Text>
        {link ? (
          <Link href={link}>{description}</Link>
        ) : (
          <Text>{description}</Text>
        )}
      </Flex>
    </Flex>
  )
}
