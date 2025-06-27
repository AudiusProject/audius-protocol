import { ReactNode, Ref, createContext, forwardRef, useContext } from 'react'

import { Divider, Flex, FlexProps, Paper, PaperProps } from '@audius/harmony'

type CardSize = 'xs' | 's' | 'm' | 'l'

type CardContextType = {
  size: CardSize
}

const CardContext = createContext<CardContextType>({ size: 'm' })

const cardSizes = {
  xs: undefined,
  s: 200,
  m: 224,
  l: 320
}

const xsSize = { minWidth: 140, maxWidth: 190 }

export type CardProps = PaperProps & {
  size: CardSize
}

export const Card = forwardRef((props: CardProps, ref: Ref<HTMLDivElement>) => {
  const { size, children, ...other } = props
  console.log('asdf size: ', size)
  return (
    <Paper
      ref={ref}
      role='button'
      tabIndex={0}
      direction='column'
      border='default'
      w={cardSizes[size]}
      css={{ overflow: 'unset', ...(size === 'xs' ? xsSize : undefined) }}
      {...other}
    >
      <CardContext.Provider value={{ size }}>{children}</CardContext.Provider>
    </Paper>
  )
})

export type CardContentProps = FlexProps

export const CardContent = (props: CardContentProps) => {
  const { size } = useContext(CardContext)

  return (
    <Flex
      direction='column'
      w='100%'
      css={size === 'xs' && { maxWidth: xsSize.minWidth, margin: '0 auto' }}
      {...props}
    />
  )
}

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
