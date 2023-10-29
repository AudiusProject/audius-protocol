import type { CSSProperties, ReactElement } from 'react'

// TODO move and use ValidationCheck from completion-check
import Close from 'assets/icons/Album.svg'
import Check from 'assets/icons/Check.svg'

import { Flex, Text } from '../../components'

const messages = {
  do: 'Do',
  dont: "Don't"
}

type ComponentRuleProps = {
  component: ReactElement
  description: ReactElement | string
  isRecommended: boolean
  style?: CSSProperties
}

export const ComponentRule = (props: ComponentRuleProps) => {
  const { component, description = '', isRecommended = false, style } = props
  const titleIcon = isRecommended ? (
    <Check color='green' />
  ) : (
    <Close color='red' />
  )
  const title = isRecommended ? messages.do : messages.dont

  return (
    <Flex as='section' direction='column' gap='xl' flex={1}>
      <Flex direction='column' gap='m'>
        <Text
          variant='title'
          tag='h5'
          style={{ display: 'inline-flex', alignItems: 'center' }}
        >
          {titleIcon}
          {title}
        </Text>
        <Text tag='section'>{description}</Text>
      </Flex>
      <Flex
        as='figure'
        p='2xl'
        border='strong'
        justifyContent='center'
        style={style}
      >
        {component}
      </Flex>
    </Flex>
  )
}
