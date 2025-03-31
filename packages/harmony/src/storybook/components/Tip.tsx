import type { ReactNode } from 'react'

import { useTheme } from '@storybook/theming'

import { Flex } from '~harmony/components'

type TipProps = {
  title: string
  description: ReactNode
  className?: string
}

export const Tip = (props: TipProps) => {
  const { title, description, className } = props
  const theme = useTheme()
  return (
    <Flex
      borderRadius='m'
      border='default'
      pv='m'
      ph='l'
      gap='s'
      direction='column'
      w={984}
      className={className}
    >
      <p
        css={{
          fontWeight: `${theme.typography.weight.bold} !important`,
          margin: 0
        }}
      >
        {title}
      </p>
      <p css={{ margin: 0 }}>{description}</p>
    </Flex>
  )
}
