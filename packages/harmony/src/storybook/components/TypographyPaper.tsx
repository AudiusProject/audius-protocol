import type { ReactNode } from 'react'

import { Flex } from 'components'

type TypographyCardProps = {
  children: ReactNode
}

export const TypographyPaper = (props: TypographyCardProps) => {
  const { children } = props

  return (
    <Flex
      p='2xl'
      gap='l'
      css={(theme) => ({
        borderRadius: theme.cornerRadius.m,
        border: `1px solid ${theme.color.border.strong}`
      })}
    >
      {children}
    </Flex>
  )
}
