import { PropsWithChildren } from 'react'

import { Paper } from '@audius/harmony'

export const SignOnContainerDesktop = ({ children }: PropsWithChildren<{}>) => {
  return (
    <Paper
      direction='row'
      w={1280}
      h={864}
      borderRadius='l'
      shadow='far'
      css={{ overflow: 'hidden' }}
    >
      {children}
    </Paper>
  )
}
