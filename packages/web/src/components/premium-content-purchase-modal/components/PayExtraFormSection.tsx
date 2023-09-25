import { HarmonySelectablePill } from '@audius/stems'
import { useField } from 'formik'

import { PriceField } from 'components/form-fields/PriceField'
import { Text } from 'components/typography'

import styles from './PayExtraFormSection.module.css'
import { AMOUNT_PRESET, CUSTOM_AMOUNT } from './constants'
import { PayExtraAmountPresetValues, PayExtraPreset } from './types'

const messages = {
  payExtra: 'Pay Extra',
  customAmount: 'Custom Amount',
  placeholder: 'Enter a value'
}

const formatPillAmount = (val: number) => `$${Math.floor(val / 100)}`

export type PayExtraFormSectionProps = {
  amountPresets: PayExtraAmountPresetValues
}

export const PayExtraFormSection = ({
  amountPresets
}: PayExtraFormSectionProps) => {
  const [{ value: preset }, , { setValue: setPreset }] = useField(AMOUNT_PRESET)

  const handleClickPreset = (newPreset: PayExtraPreset) => {
    setPreset(newPreset === preset ? PayExtraPreset.NONE : newPreset)
  }
  return (
    <div className={styles.container}>
      <Text variant='title' color='neutralLight4' className={styles.title}>
        {messages.payExtra}
      </Text>
      <div className={styles.pillContainer}>
        <div className={styles.presetContainer}>
          <HarmonySelectablePill
            className={styles.presetPill}
            isSelected={preset === PayExtraPreset.LOW}
            label={formatPillAmount(amountPresets[PayExtraPreset.LOW])}
            size='large'
            onClick={() => handleClickPreset(PayExtraPreset.LOW)}
          />
          <HarmonySelectablePill
            className={styles.presetPill}
            isSelected={preset === PayExtraPreset.MEDIUM}
            label={formatPillAmount(amountPresets[PayExtraPreset.MEDIUM])}
            size='large'
            onClick={() => handleClickPreset(PayExtraPreset.MEDIUM)}
          />
          <HarmonySelectablePill
            className={styles.presetPill}
            isSelected={preset === PayExtraPreset.HIGH}
            label={formatPillAmount(amountPresets[PayExtraPreset.HIGH])}
            size='large'
            onClick={() => handleClickPreset(PayExtraPreset.HIGH)}
          />
        </div>
        <HarmonySelectablePill
          className={styles.customAmountPill}
          isSelected={preset === PayExtraPreset.CUSTOM}
          label={messages.customAmount}
          size='large'
          onClick={() => handleClickPreset(PayExtraPreset.CUSTOM)}
        />
      </div>
      {preset === PayExtraPreset.CUSTOM ? (
        <PriceField
          placeholder={messages.placeholder}
          label={messages.customAmount}
          name={CUSTOM_AMOUNT}
        />
      ) : null}
    </div>
  )
}
