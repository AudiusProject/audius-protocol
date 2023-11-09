import { Flex, Text, Link, IconComponent } from 'components'

type CardLinkProps = {
  icon?: IconComponent
  subtitle: string
  description: string
  link: string
}

export const CardLink = (props: CardLinkProps) => {
  const { icon: Icon, subtitle, description, link } = props
  return (
    <Flex direction='column' p='xl' gap='xl' border='strong' flex='1'>
      {Icon ? <Icon size='l' color='default' /> : null}
      <Flex direction='column' gap='s'>
        <Link href={link} variant='heading'>
          {subtitle}
        </Link>
        <Text>{description}</Text>
      </Flex>
    </Flex>
  )
}
