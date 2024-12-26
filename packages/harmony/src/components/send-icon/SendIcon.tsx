import { useTheme } from '@emotion/react'

import { IconButton } from '~harmony/components/button'
import { IconPaperAirplane } from '~harmony/icons'

import { SendIconProps } from './types'

export const SendIcon = ({ disabled = false, onClick }: SendIconProps) => {
  const { color, motion } = useTheme()

  return (
    <IconButton
      aria-label='Send'
      icon={IconPaperAirplane}
      size='2xl'
      onClick={onClick}
      css={{
        cursor: 'pointer',
        pointerEvents: disabled ? 'none' : 'all',
        opacity: disabled ? 0.5 : 1,
        path: {
          fill: color.primary.primary,
          transition: motion.quick
        },
        ':hover path': {
          fill: color.primary.p100
        },
        ':active path': {
          fill: color.primary.p500
        }
      }}
    />
  )
}
