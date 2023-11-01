import type { ReactElement } from 'react'

import type { CSSObject } from '@emotion/react'

import { Flex } from 'components'

import { ComponentRule } from './ComponentRule'

type ComponentRulesProps = {
  rules: {
    positive: {
      component: ReactElement
      description: string | ReactElement
      css?: CSSObject
    }

    negative: {
      component: ReactElement
      description: string | ReactElement
      css?: CSSObject
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
              css={rule.positive.css}
              isRecommended
            />
            <ComponentRule
              component={rule.negative.component}
              description={rule.negative.description}
              css={rule.negative.css}
              isRecommended={false}
            />
          </Flex>
        )
      })}
    </Flex>
  )
}
