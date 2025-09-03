import { Flex, TextInput } from '@audius/harmony'
import { useFormikContext } from 'formik'

import type { SetupFormValues } from './types'

const messages = {
  coinName: 'Coin Name',
  coinSymbol: 'Coin Symbol'
}

export const CoinFormFields = () => {
  const { values, errors, touched, handleChange, handleBlur, validateField } =
    useFormikContext<SetupFormValues>()

  const handleCoinSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e)
    // Debounced validation for better UX
    if (e.target.value) {
      setTimeout(() => validateField('coinSymbol'), 1000)
    }
  }

  return (
    <Flex gap='xl' w='100%'>
      <Flex direction='column' w='100%'>
        <TextInput
          label={messages.coinName}
          name='coinName'
          value={values.coinName}
          onChange={handleChange}
          onBlur={handleBlur}
          error={!!(touched.coinName && errors.coinName)}
          helperText={touched.coinName ? errors.coinName : undefined}
          maxLength={30}
        />
      </Flex>
      <Flex direction='column' w='100%'>
        <TextInput
          label={messages.coinSymbol}
          name='coinSymbol'
          value={values.coinSymbol}
          onChange={handleCoinSymbolChange}
          onBlur={handleBlur}
          error={!!(touched.coinSymbol && errors.coinSymbol)}
          helperText={touched.coinSymbol ? errors.coinSymbol : undefined}
          startAdornmentText='$'
          maxLength={10}
          css={{ '& input': { textTransform: 'uppercase' } }}
        />
      </Flex>
    </Flex>
  )
}
