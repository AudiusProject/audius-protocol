import { PropsWithChildren } from 'react'

import { Paper } from '@audius/harmony'

import { useMedia } from 'hooks/useMedia'

type ContinueFooterProps = PropsWithChildren

export const ContinueFooter = ({ children }: ContinueFooterProps) => {
  const { isMobile } = useMedia()
  return (
    <Paper
      w='100%'
      p='l'
      justifyContent='center'
      gap='l'
      alignItems='center'
      direction='column'
      shadow={isMobile ? undefined : 'midInverted'}
      backgroundColor='white'
    >
      {children}
    </Paper>
  )
}
