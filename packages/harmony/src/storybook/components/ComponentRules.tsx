import type { ReactElement } from 'react'

import type { CSSObject } from '@emotion/react'

import { Flex } from '~harmony/components'

import { ComponentRule, ComponentRuleSize } from './ComponentRule'

type ComponentRulesProps = {
  rules: {
    positive: {
      component: ReactElement
      description: string | ReactElement
      css?: CSSObject
      size: ComponentRuleSize
    }

    negative: {
      component: ReactElement
      description: string | ReactElement
      css?: CSSObject
      size: ComponentRuleSize
    }
  }[]
}

export const ComponentRules = (props: ComponentRulesProps) => {
  const { rules = [] } = props

  return (
    <Flex as='article' direction='column' gap='3xl'>
      {rules.map((rule, index) => {
        const key = `rule-${index}`

        return (
          <Flex as='section' key={key} gap='3xl' wrap='wrap'>
            <ComponentRule isRecommended {...rule.positive} />
            <ComponentRule isRecommended={false} {...rule.negative} />
          </Flex>
        )
      })}
    </Flex>
  )
}
