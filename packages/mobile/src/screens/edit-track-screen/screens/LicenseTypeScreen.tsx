import { useEffect } from 'react'

import type { Nullable } from '@audius/common'
import { creativeCommons } from '@audius/common'
import { useField } from 'formik'
import { ScrollView, View } from 'react-native'

import { IconCcCC } from '@audius/harmony-native'
import type { TextProps } from 'app/components/core'
import { Divider, SegmentedControl, Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

import { FormScreen } from '../components'
import { computeLicenseIcons } from '../utils/computeLicenseIcons'
const { computeLicense } = creativeCommons

const messages = {
  title: 'License Type',
  allowAttributionLabel: 'Allow Attribution?',
  allowAttribution: 'Allow Attribution',
  noAttribution: 'No Attribution',
  commercialUseLabel: 'Commercial Use?',
  commercialUse: 'Commercial Use',
  nonCommercialUse: 'Non-Commercial Use',
  derivativeWorksLabel: 'Derivative Works?',
  allowed: 'Allowed',
  shareAlike: 'Share-Alike',
  notAllowed: 'Not Allowed'
}

const allowAttributionValues = [
  { key: true, text: messages.allowAttribution },
  { key: false, text: messages.noAttribution }
]

const commercialUseValues = [
  { key: true, text: messages.commercialUse },
  { key: false, text: messages.nonCommercialUse }
]

const derivativeWorksValues = [
  { key: null, text: messages.allowed },
  { key: true, text: messages.shareAlike },
  { key: false, text: messages.notAllowed }
]

const useStyles = makeStyles(({ spacing, palette, typography }) => ({
  content: {
    paddingHorizontal: spacing(6),
    paddingVertical: spacing(8)
  },
  licenseSection: {
    marginBottom: spacing(6)
  },
  licenseSectionLabel: {
    lineHeight: 22,
    marginBottom: spacing(2)
  },
  divider: {
    marginBottom: spacing(6)
  },
  licenseDescription: {
    padding: spacing(4),
    backgroundColor: palette.neutralLight10,
    borderWidth: 1,
    borderColor: palette.neutralLight8,
    borderRadius: spacing(2)
  },
  licenseIcons: {
    flexDirection: 'row',
    marginBottom: spacing(2)
  },
  licenseIcon: {
    marginRight: spacing(1)
  },
  descriptionText: {
    lineHeight: typography.fontSize.small * 1.5
  }
}))

export const LicenseTypeScreen = () => {
  const [{ onChange }] = useField('license')
  const [{ value: allowAttribution }, , { setValue: setAllowAttribution }] =
    useField<boolean>('licenseType.allowAttribution')
  const [{ value: commercialUse }, , { setValue: setCommercialUse }] =
    useField<boolean>('licenseType.commercialUse')
  const [{ value: derivativeWorks }, , { setValue: setDerivateWorks }] =
    useField<Nullable<boolean>>('licenseType.derivativeWorks')

  const styles = useStyles()
  const { neutral } = useThemeColors()

  const { licenseType, licenseDescription } = computeLicense(
    allowAttribution,
    commercialUse,
    derivativeWorks
  )

  const licenseIcons = computeLicenseIcons(
    allowAttribution,
    commercialUse,
    derivativeWorks
  )

  useEffect(() => {
    onChange('license')(licenseType)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [licenseType])

  const labelProps: TextProps = {
    fontSize: 'large',
    weight: 'demiBold',
    style: styles.licenseSectionLabel
  }

  return (
    <FormScreen title={messages.title} icon={IconCcCC} variant='white'>
      <ScrollView>
        <View style={styles.content}>
          <View style={styles.licenseSection}>
            <Text {...labelProps}>{messages.allowAttributionLabel}</Text>
            <SegmentedControl
              fullWidth
              defaultSelected={allowAttribution}
              options={allowAttributionValues}
              onSelectOption={setAllowAttribution}
            />
          </View>
          <Divider style={styles.divider} />
          <View style={styles.licenseSection}>
            <Text {...labelProps}>{messages.commercialUseLabel}</Text>
            <SegmentedControl
              fullWidth
              defaultSelected={commercialUse}
              options={commercialUseValues}
              onSelectOption={setCommercialUse}
            />
          </View>
          <Divider style={styles.divider} />
          <View style={styles.licenseSection}>
            <Text {...labelProps}>{messages.derivativeWorksLabel}</Text>
            <SegmentedControl
              fullWidth
              defaultSelected={derivativeWorks}
              options={derivativeWorksValues}
              onSelectOption={setDerivateWorks}
            />
          </View>
          <Divider style={styles.divider} />
          <View>
            {licenseIcons ? (
              <View style={styles.licenseIcons}>
                {licenseIcons.map(([Icon, key]) => (
                  <Icon
                    key={key}
                    fill={neutral}
                    style={styles.licenseIcon}
                    height={spacing(7)}
                    width={spacing(7)}
                  />
                ))}
              </View>
            ) : null}
            <Text {...labelProps}>{licenseType}</Text>
            {licenseDescription ? (
              <View style={styles.licenseDescription}>
                <Text variant='body' style={styles.descriptionText}>
                  {licenseDescription}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </FormScreen>
  )
}
