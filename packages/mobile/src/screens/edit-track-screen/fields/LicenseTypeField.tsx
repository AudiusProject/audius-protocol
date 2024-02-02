import { useCallback } from 'react'

import type { Nullable } from '@audius/common/utils'
import { useField } from 'formik'
import { View } from 'react-native'

import type { ContextualMenuProps } from 'app/components/core'
import { ContextualMenu, Pill } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

import { computeLicenseIcons } from '../utils/computeLicenseIcons'

const messages = {
  licenseType: 'License Type',
  noLicense: 'All Rights Reserved'
}

const useStyles = makeStyles(({ spacing }) => ({
  licenseIcons: {
    marginTop: spacing(4),
    alignItems: 'flex-start'
  },
  pill: {
    paddingVertical: 2
  },
  licenseIcon: {
    marginRight: spacing(1)
  }
}))

type LicenseTypeFieldProps = Partial<ContextualMenuProps>

export const LicenseTypeField = (props: LicenseTypeFieldProps) => {
  const [{ value: license }] = useField<Nullable<string>>('license')
  const [{ value: allowAttribution }] = useField<boolean>(
    'licenseType.allowAttribution'
  )
  const [{ value: commercialUse }] = useField<boolean>(
    'licenseType.commercialUse'
  )
  const [{ value: derivativeWorks }] = useField<Nullable<boolean>>(
    'licenseType.derivativeWorks'
  )

  const styles = useStyles()
  const { neutral } = useThemeColors()

  const renderValue = useCallback(() => {
    const licenseIcons = computeLicenseIcons(
      allowAttribution,
      commercialUse,
      derivativeWorks
    )

    return licenseIcons ? (
      <View style={styles.licenseIcons}>
        <Pill style={styles.pill}>
          {licenseIcons.map(([Icon, key]) => (
            <Icon
              key={key}
              fill={neutral}
              style={styles.licenseIcon}
              height={spacing(6)}
              width={spacing(6)}
            />
          ))}
        </Pill>
      </View>
    ) : null
  }, [allowAttribution, commercialUse, derivativeWorks, styles, neutral])

  return (
    <ContextualMenu
      value={license || messages.noLicense}
      label={messages.licenseType}
      menuScreenName='LicenseType'
      renderValue={
        license && license !== messages.noLicense ? renderValue : undefined
      }
      {...props}
    />
  )
}
