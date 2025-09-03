import { Flex, TextInput } from '@audius/harmony'

import type { CoinFormFieldsProps } from './types'

const messages = {
  coinName: 'Coin Name',
  coinSymbol: 'Coin Symbol'
}

export const CoinFormFields = ({
  values,
  errors,
  touched,
  onChange,
  onBlur
}: CoinFormFieldsProps) => {
  // For now, we'll use immediate validation instead of debounced
  // since we're not in a Formik context
  const handleCoinSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e)
    // Validation will happen through Formik's built-in validation
  }

  return (
    <Flex gap='xl' w='100%'>
      <Flex direction='column' w='100%'>
        <TextInput
          label={messages.coinName}
          name='coinName'
          value={values.coinName}
          onChange={onChange}
          onBlur={onBlur}
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
          onBlur={onBlur}
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
