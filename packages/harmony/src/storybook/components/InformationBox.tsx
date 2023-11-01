import type { ReactElement } from 'react'

import { Flex, Link } from 'components'

type InformationBoxProps = {
  component: ReactElement
  title: string
  description: string
  href: string
}

const InformationBox = (props: InformationBoxProps) => {
  const { component = null, title, description, href } = props

  return (
    <Flex as='section' direction='column' flex={1} gap='m'>
      <Flex
        as='figure'
        p='3xl'
        alignItems='center'
        justifyContent='center'
        css={(theme) => ({
          backgroundColor: theme.color.background.default,
          height: 147
        })}
      >
        {component}
      </Flex>
      <Link href={href}>{title}</Link>
      <section>{description}</section>
    </Flex>
  )
}

export default InformationBox
