import type { CSSProperties, ReactElement } from 'react'

import {
  Flex,
  IconValidationCheck,
  IconValidationX,
  Text
} from '../../components'

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
  const TitleIcon = isRecommended ? IconValidationCheck : IconValidationX
  const title = isRecommended ? messages.do : messages.dont

  return (
    <Flex as='section' direction='column' gap='xl' flex={1}>
      <Flex direction='column' gap='m'>
        <Text
          variant='title'
          tag='h5'
          style={{ display: 'flex', alignItems: 'center' }}
        >
          <TitleIcon size='small' style={{ marginRight: '8px' }} /> {title}
        </Text>
        <Text tag='section' style={{ height: '32px', overflow: 'hidden' }}>
          {description}
        </Text>
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
