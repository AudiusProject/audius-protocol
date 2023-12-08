import type { PropsWithChildren } from 'react'

import { css } from '@emotion/native'
import { useTheme } from '@emotion/react'

import type { FlexProps } from '@audius/harmony-native'
import { Box, Flex } from '@audius/harmony-native'

export type HintProps = PropsWithChildren<{ icon?: any }> & FlexProps

export const Hint = ({ icon: Icon, children, ...rest }: HintProps) => {
  const { color } = useTheme()
  const hasIcon = !!Icon
  return (
    <Flex
      direction='row'
      {...rest}
      border='strong'
      borderRadius='m'
      justifyContent={hasIcon ? 'space-between' : 'center'}
      ph='l'
      pv='m'
      style={css({
        backgroundColor: color.background.surface2
      })}
    >
      {hasIcon ? <Icon height={24} width={24} /> : null}
      {children}
      {hasIcon ? <Box w={24} h={24} /> : null}
    </Flex>
  )
}
