import { ChangeEvent, forwardRef, Ref } from 'react'

import { TextInput } from '@audius/harmony'

import { WalletInputProps } from './types'

export const WalletInput = forwardRef(
  (props: WalletInputProps, ref: Ref<HTMLInputElement>) => {
    const { value, onChange, error, helperText, ...other } = props

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (onChange) {
        onChange(e)
      }
    }

    return (
      <TextInput
        ref={ref}
        {...other}
        value={value}
        onChange={handleChange}
        error={error}
        helperText={helperText}
        placeholder='Wallet Address'
      />
    )
  }
)

export default WalletInput
