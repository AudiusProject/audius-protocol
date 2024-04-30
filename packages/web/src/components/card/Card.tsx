import { Divider, Flex, Paper, PaperProps } from '@audius/harmony'
import { ReactNode, Ref, forwardRef } from 'react'

type CardSize = 's' | 'm' | 'l'

const cardSizes = {
  s: 200,
  m: 224,
  l: 320
}

export type CardProps = PaperProps & {
  size: CardSize
  footer: ReactNode
}

export const Card = forwardRef((props: CardProps, ref: Ref<HTMLDivElement>) => {
  const { size, children, footer, ...other } = props
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
      <Divider orientation='horizontal' />
      <Flex
        gap='l'
        p='s'
        justifyContent='center'
        backgroundColor='surface1'
        borderBottomLeftRadius='m'
        borderBottomRightRadius='m'
      >
        {footer}
      </Flex>
    </Paper>
  )
})
