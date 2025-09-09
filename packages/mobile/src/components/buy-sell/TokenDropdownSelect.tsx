import { useCallback } from 'react'

import type { TokenInfo } from '@audius/common/store'
import { TouchableOpacity } from 'react-native'

import { Text, Flex, IconCaretDown } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

import { TokenIcon } from '../core'

type TokenDropdownSelectProps = {
  selectedToken: TokenInfo
  navigationRoute: string
}

export const TokenDropdownSelect = ({
  selectedToken,
  navigationRoute
}: TokenDropdownSelectProps) => {
  const navigation = useNavigation()

  const handlePressButton = useCallback(() => {
    navigation.navigate(navigationRoute)
  }, [navigation, navigationRoute])

  if (!selectedToken) {
    return null
  }

  return (
    <TouchableOpacity onPress={handlePressButton}>
      <Flex
        row
        border='strong'
        borderRadius='s'
        justifyContent='space-between'
        alignItems='center'
        pv='s'
        ph='m'
        w='100%'
      >
        <Flex row alignItems='center' gap='s'>
          {selectedToken ? (
            <TokenIcon logoURI={selectedToken.logoURI} size={48} />
          ) : null}
          <Text variant='heading' size='s' color='subdued'>
            {selectedToken.symbol}
          </Text>
        </Flex>
        <IconCaretDown color='default' size='s' />
      </Flex>
    </TouchableOpacity>
  )
}
