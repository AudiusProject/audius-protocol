import type { PayExtraAmountPresetValues } from '@audius/common'
import { AMOUNT_PRESET, CUSTOM_AMOUNT, PayExtraPreset } from '@audius/common'
import { useField } from 'formik'
import { View } from 'react-native'

import { flexRowCentered, makeStyles } from 'app/styles'

import { HarmonySelectablePill } from '../core/HarmonySelectablePill'
import { Text } from '../core/Text'
import { PriceField } from '../fields/PriceField'

const useStyles = makeStyles(({ spacing }) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing(4)
  },
  pillContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing(2)
  },
  presetContainer: {
    ...flexRowCentered(),
    gap: spacing(2),
    width: '100%'
  },
  pill: {
    flexGrow: 1,
    flexShrink: 0
  },
  title: {
    lineHeight: spacing(5)
  }
}))

const messages = {
  payExtra: 'PAY EXTRA',
  customAmount: 'Custom Amount',
  placeholder: 'Enter a value'
}

const formatPillAmount = (val: number) => `$${Math.floor(val / 100)}`

export type PayExtraFormSectionProps = {
  amountPresets: PayExtraAmountPresetValues
  isDisabled?: boolean
}

export const PayExtraFormSection = ({
  amountPresets,
  isDisabled
}: PayExtraFormSectionProps) => {
  const [{ value: preset }, , { setValue: setPreset }] = useField(AMOUNT_PRESET)
  const [{ value: customAmount }, { error: customAmountError }] =
    useField(CUSTOM_AMOUNT)
  const styles = useStyles()

  const handleClickPreset = (newPreset: PayExtraPreset) => {
    setPreset(newPreset === preset ? PayExtraPreset.NONE : newPreset)
  }
  return (
    <View style={styles.container}>
      <Text weight='bold' fontSize='medium' color='neutralLight4' noGutter>
        {messages.payExtra}
      </Text>
      <View style={styles.pillContainer}>
        <View style={styles.presetContainer}>
          <HarmonySelectablePill
            size='large'
            style={styles.pill}
            isSelected={preset === PayExtraPreset.LOW}
            label={formatPillAmount(amountPresets[PayExtraPreset.LOW])}
            isDisabled={isDisabled}
            onPress={() => handleClickPreset(PayExtraPreset.LOW)}
          />
          <HarmonySelectablePill
            size='large'
            style={styles.pill}
            isSelected={preset === PayExtraPreset.MEDIUM}
            label={formatPillAmount(amountPresets[PayExtraPreset.MEDIUM])}
            isDisabled={isDisabled}
            onPress={() => handleClickPreset(PayExtraPreset.MEDIUM)}
          />
          <HarmonySelectablePill
            size='large'
            style={styles.pill}
            isSelected={preset === PayExtraPreset.HIGH}
            label={formatPillAmount(amountPresets[PayExtraPreset.HIGH])}
            isDisabled={isDisabled}
            onPress={() => handleClickPreset(PayExtraPreset.HIGH)}
          />
        </View>
        <HarmonySelectablePill
          size='large'
          style={styles.pill}
          isSelected={preset === PayExtraPreset.CUSTOM}
          label={messages.customAmount}
          isDisabled={isDisabled}
          onPress={() => handleClickPreset(PayExtraPreset.CUSTOM)}
        />
      </View>
      {preset === PayExtraPreset.CUSTOM ? (
        <PriceField
          name={CUSTOM_AMOUNT}
          label={messages.customAmount}
          value={String(customAmount)}
          placeholder={messages.placeholder}
          errorMessage={customAmountError}
          noGutter
        />
      ) : null}
    </View>
  )
}
