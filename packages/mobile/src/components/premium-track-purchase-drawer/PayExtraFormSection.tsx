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
    gap: spacing(2)
  },
  pillContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing(2)
  },
  presetContainer: {
    ...flexRowCentered(),
    flexWrap: 'wrap',
    gap: spacing(2),
    width: '100%'
  },
  pill: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    minWidth: spacing(10)
  },
  customPill: {
    minWidth: spacing(20)
  },
  title: {
    letterSpacing: 0.5
  }
}))

const messages = {
  payExtra: 'PAY EXTRA',
  other: 'Other',
  customAmount: 'Custom Amount',
  placeholder: 'Enter a value'
}

const formatPillAmount = (val: number) => `$${Math.floor(val / 100)}`

export type PayExtraFormSectionProps = {
  amountPresets: PayExtraAmountPresetValues
  disabled?: boolean
}

export const PayExtraFormSection = ({
  amountPresets,
  disabled
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
      <Text
        weight='heavy'
        fontSize='small'
        color='neutralLight4'
        style={styles.title}
        noGutter
      >
        {messages.payExtra}
      </Text>
      <View style={styles.presetContainer}>
        <HarmonySelectablePill
          size='large'
          style={styles.pill}
          isSelected={preset === PayExtraPreset.LOW}
          label={formatPillAmount(amountPresets[PayExtraPreset.LOW])}
          disabled={disabled}
          onPress={() => handleClickPreset(PayExtraPreset.LOW)}
        />
        <HarmonySelectablePill
          size='large'
          style={styles.pill}
          isSelected={preset === PayExtraPreset.MEDIUM}
          label={formatPillAmount(amountPresets[PayExtraPreset.MEDIUM])}
          disabled={disabled}
          onPress={() => handleClickPreset(PayExtraPreset.MEDIUM)}
        />
        <HarmonySelectablePill
          size='large'
          style={styles.pill}
          isSelected={preset === PayExtraPreset.HIGH}
          label={formatPillAmount(amountPresets[PayExtraPreset.HIGH])}
          disabled={disabled}
          onPress={() => handleClickPreset(PayExtraPreset.HIGH)}
        />
        <HarmonySelectablePill
          size='large'
          style={[styles.pill, styles.customPill]}
          isSelected={preset === PayExtraPreset.CUSTOM}
          label={messages.other}
          disabled={disabled}
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
          editable={!disabled}
          noGutter
        />
      ) : null}
    </View>
  )
}
