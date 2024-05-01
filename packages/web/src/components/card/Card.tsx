import { ReactNode, Ref, forwardRef } from 'react'

import { Divider, Flex, Paper, PaperProps } from '@audius/harmony'

type CardSize = 's' | 'm' | 'l'

const cardSizes = {
  s: 200,
  m: 224,
  l: 320
}

export type CardProps = PaperProps & {
  size: CardSize
}

export const Card = forwardRef((props: CardProps, ref: Ref<HTMLDivElement>) => {
  const { size, children, ...other } = props
  return (
    <Paper
      ref={ref}
      role='button'
      tabIndex={0}
      direction='column'
      border='default'
      w={cardSizes[size]}
      css={{ cursor: 'pointer', overflow: 'unset' }}
      {...other}
    >
      {children}
    </Paper>
  )
})

export type CardFooterProps = {
  children: ReactNode
}

export const CardFooter = (props: CardFooterProps) => {
  const { children } = props
  return (
    <>
      <Divider orientation='horizontal' />
      <Flex
        gap='l'
        pv='s'
        justifyContent='center'
        backgroundColor='surface1'
        borderBottomLeftRadius='m'
        borderBottomRightRadius='m'
      >
        {children}
      </Flex>
    </>
  )
}
