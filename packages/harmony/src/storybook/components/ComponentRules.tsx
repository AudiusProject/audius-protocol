import type { CSSProperties, ReactElement } from 'react'

import { Flex } from 'components'

import { ComponentRule } from './ComponentRule'

type ComponentRulesProps = {
  rules: {
    positive: {
      component: ReactElement
      description: string | ReactElement
      style?: CSSProperties
    }

    negative: {
      component: ReactElement
      description: string | ReactElement
      style?: CSSProperties
    }
  }[]
}

export const ComponentRules = (props: ComponentRulesProps) => {
  const { rules = [] } = props

  return (
    <Flex as='article' direction='column' gap='3xl' mt='3xl'>
      {rules.map((rule, index) => {
        const key = `rule-${index}`

        return (
          <Flex as='section' key={key} gap='3xl'>
            <ComponentRule
              component={rule.positive.component}
              description={rule.positive.description}
              style={rule.positive.style}
              isRecommended
            />
            <ComponentRule
              component={rule.negative.component}
              description={rule.negative.description}
              style={rule.negative.style}
              isRecommended={false}
            />
          </Flex>
        )
      })}
    </Flex>
  )
}
