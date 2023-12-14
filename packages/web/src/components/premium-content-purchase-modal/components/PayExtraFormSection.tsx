import {
  CUSTOM_AMOUNT,
  PayExtraAmountPresetValues,
  PayExtraPreset
} from '@audius/common'
import { Text, Flex, SelectablePill } from '@audius/harmony'
import { useField } from 'formik'

import { PriceField } from 'components/form-fields/PriceField'

import styles from './PayExtraFormSection.module.css'

const messages = {
  customAmount: 'Custom Amount',
  other: 'Other',
  placeholder: 'Enter a value'
}

const formatPillAmount = (val: number) => `$${Math.floor(val / 100)}`

export type PayExtraFormSectionProps = {
  title: string
  fieldName: string
  amountPresets: PayExtraAmountPresetValues
  disabled?: boolean
}

export const PayExtraFormSection = ({
  title,
  fieldName,
  amountPresets,
  disabled
}: PayExtraFormSectionProps) => {
  const [{ value: preset }, , { setValue: setPreset }] = useField(fieldName)

  const handleClickPreset = (newPreset: PayExtraPreset) => {
    setPreset(newPreset === preset ? PayExtraPreset.NONE : newPreset)
  }

  return (
    <Flex gap='s' direction='column' w='100%'>
      <Text
        variant='label'
        strength='strong'
        color='subdued'
        className={styles.title}
      >
        {title}
      </Text>
      <Flex gap='s' w='100%'>
        <SelectablePill
          className={styles.presetPill}
          isSelected={preset === PayExtraPreset.LOW}
          label={formatPillAmount(amountPresets[PayExtraPreset.LOW])}
          size='large'
          type='button'
          onClick={() => handleClickPreset(PayExtraPreset.LOW)}
          disabled={disabled}
        />
        <SelectablePill
          className={styles.presetPill}
          isSelected={preset === PayExtraPreset.MEDIUM}
          label={formatPillAmount(amountPresets[PayExtraPreset.MEDIUM])}
          size='large'
          type='button'
          onClick={() => handleClickPreset(PayExtraPreset.MEDIUM)}
          disabled={disabled}
        />
        <SelectablePill
          className={styles.presetPill}
          isSelected={preset === PayExtraPreset.HIGH}
          label={formatPillAmount(amountPresets[PayExtraPreset.HIGH])}
          size='large'
          type='button'
          onClick={() => handleClickPreset(PayExtraPreset.HIGH)}
          disabled={disabled}
        />
        <SelectablePill
          className={styles.presetPill}
          isSelected={preset === PayExtraPreset.CUSTOM}
          label={messages.other}
          size='large'
          type='button'
          onClick={() => handleClickPreset(PayExtraPreset.CUSTOM)}
          disabled={disabled}
        />
      </Flex>
      {preset === PayExtraPreset.CUSTOM ? (
        <PriceField
          placeholder={messages.placeholder}
          label={messages.customAmount}
          name={CUSTOM_AMOUNT}
          disabled={disabled}
        />
      ) : null}
    </Flex>
  )
}
