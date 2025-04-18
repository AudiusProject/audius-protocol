import { useCallback } from 'react'

import { useTokenPrice } from '@audius/common/api'
import { TOKEN_LISTING_MAP, walletSelectors } from '@audius/common/store'
import { AUDIO } from '@audius/fixed-decimal'
import { TouchableOpacity } from 'react-native'
import { useSelector } from 'react-redux'

import {
  Flex,
  IconCaretRight,
  IconLogoCircle,
  Paper,
  Text
} from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

const { getAccountTotalBalance } = walletSelectors

const messages = {
  title: 'Your Coins',
  loading: '-- $AUDIO',
  dollarZero: '$0.00',
  loadingPrice: '$0.00 (loading...)'
}

// AUDIO token address from Jupiter
const AUDIO_TOKEN_ID = TOKEN_LISTING_MAP.AUDIO.address

const ICON_SIZE = 48

const useStyles = makeStyles(({ palette }) => ({
  container: {
    borderRadius: spacing(4)
  },
  iconWrapper: {
    width: ICON_SIZE,
    height: ICON_SIZE
  },
  tokenRow: {
    borderRadius: spacing(4)
  }
}))

export const YourCoins = () => {
  const navigation = useNavigation()
  const styles = useStyles()
  const totalBalance = useSelector(getAccountTotalBalance)

  const { data: audioPriceData, isPending: isLoadingPrice } =
    useTokenPrice(AUDIO_TOKEN_ID)

  const audioPrice = audioPriceData?.price || null

  // Format the balance for display using toLocaleString for numbers with commas
  const audioAmount = totalBalance
    ? `${AUDIO(totalBalance).toLocaleString()}`
    : messages.loading

  const handleTokenClick = useCallback(() => {
    navigation.navigate('AudioScreen')
  }, [navigation])

  // Calculate dollar value of user's AUDIO balance
  const dollarValue = (() => {
    if (!audioPrice || !totalBalance) return messages.dollarZero

    const priceNumber = parseFloat(audioPrice)
    const balanceValue = parseFloat(AUDIO(totalBalance).toString())
    const totalValue = priceNumber * balanceValue

    return `$${totalValue.toFixed(2)} ($${parseFloat(audioPrice).toFixed(4)})`
  })()

  return (
    <Paper style={styles.container}>
      <TouchableOpacity onPress={handleTokenClick}>
        <Flex
          p='l'
          direction='row'
          justifyContent='space-between'
          alignItems='center'
          style={styles.tokenRow}
        >
          <Flex direction='row' alignItems='center' gap='m'>
            <IconLogoCircle width={ICON_SIZE} height={ICON_SIZE} />
            <Flex direction='column' gap='xs'>
              <Flex direction='row' alignItems='center' gap='xs'>
                <Text variant='heading' size='l' color='default'>
                  {audioAmount}
                </Text>
                <Text variant='heading' size='l' color='subdued'>
                  $AUDIO
                </Text>
              </Flex>
              <Text variant='heading' size='s' color='subdued'>
                {isLoadingPrice ? messages.loadingPrice : dollarValue}
              </Text>
            </Flex>
          </Flex>
          <IconCaretRight size='s' color='subdued' />
        </Flex>
      </TouchableOpacity>
    </Paper>
  )
}
