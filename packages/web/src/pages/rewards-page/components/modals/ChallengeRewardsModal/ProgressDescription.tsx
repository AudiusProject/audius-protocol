import { Text, TextProps } from '@audius/harmony'

import { useIsMobile } from 'hooks/useIsMobile'

type ProgressDescriptionProps = TextProps

export const ProgressDescription = (props: ProgressDescriptionProps) => {
  const isMobile = useIsMobile()
  return (
    <Text
      variant='body'
      size='l'
      textAlign={isMobile ? 'center' : 'left'}
      {...props}
    />
  )
}
