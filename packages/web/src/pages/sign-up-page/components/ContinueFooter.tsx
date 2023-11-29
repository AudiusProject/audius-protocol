import { PropsWithChildren } from 'react'

import { BoxProps, Paper, PaperProps } from '@audius/harmony'

import { useMedia } from 'hooks/useMedia'

type ContinueFooterProps = PropsWithChildren<{
  className?: string
  sticky?: boolean
}> &
  PaperProps &
  BoxProps

export const ContinueFooter = (props: ContinueFooterProps) => {
  const { children, className, sticky, ...other } = props
  const { isMobile } = useMedia()
  return (
    <Paper
      className={className}
      w='100%'
      p='l'
      justifyContent='center'
      gap='l'
      alignItems='center'
      direction='column'
      shadow={isMobile && !sticky ? 'flat' : 'midInverted'}
      backgroundColor='white'
      css={{
        overflow: 'unset',
        position: sticky ? 'sticky' : 'absolute',
        bottom: 0,
        left: 0,
        zIndex: 1
      }}
      {...other}
    >
      {children}
    </Paper>
  )
}
