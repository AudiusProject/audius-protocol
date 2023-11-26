import { PropsWithChildren } from 'react'

import { Paper } from '@audius/harmony'

import { useMedia } from 'hooks/useMedia'

type ContinueFooterProps = PropsWithChildren<{
  className?: string
  sticky?: boolean
}>

export const ContinueFooter = (props: ContinueFooterProps) => {
  const { children, className, sticky } = props
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
    >
      {children}
    </Paper>
  )
}
