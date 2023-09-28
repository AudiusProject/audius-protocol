import type { PayExtraAmountPresetValues } from '@audius/common'
import { AMOUNT_PRESET, CUSTOM_AMOUNT, PayExtraPreset } from '@audius/common'
import { PriceField } from 'components/form-fields/PriceField'
import { useField } from 'formik'
import { View } from 'react-native'

import { flexRowCentered, makeStyles } from 'app/styles'

import { HarmonySelectablePill } from '../core/HarmonySelectablePill'
import { Text } from '../core/Text'

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
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
}

export const PayExtraFormSection = ({
  amountPresets
}: PayExtraFormSectionProps) => {
  const [{ value: preset }, , { setValue: setPreset }] = useField(AMOUNT_PRESET)
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
            style={styles.pill}
            isSelected={preset === PayExtraPreset.LOW}
            label={formatPillAmount(amountPresets[PayExtraPreset.LOW])}
            onPress={() => handleClickPreset(PayExtraPreset.LOW)}
          />
          <HarmonySelectablePill
            style={styles.pill}
            isSelected={preset === PayExtraPreset.MEDIUM}
            label={formatPillAmount(amountPresets[PayExtraPreset.MEDIUM])}
            onPress={() => handleClickPreset(PayExtraPreset.MEDIUM)}
          />
          <HarmonySelectablePill
            style={styles.pill}
            isSelected={preset === PayExtraPreset.HIGH}
            label={formatPillAmount(amountPresets[PayExtraPreset.HIGH])}
            onPress={() => handleClickPreset(PayExtraPreset.HIGH)}
          />
        </View>
        <HarmonySelectablePill
          style={styles.pill}
          isSelected={preset === PayExtraPreset.CUSTOM}
          label={messages.customAmount}
          onPress={() => handleClickPreset(PayExtraPreset.CUSTOM)}
        />
      </View>
      {/* {preset === PayExtraPreset.CUSTOM ? (
        <PriceField
          placeholder={messages.placeholder}
          label={messages.customAmount}
          name={CUSTOM_AMOUNT}
        />
      ) : null} */}
    </View>
  )
}
