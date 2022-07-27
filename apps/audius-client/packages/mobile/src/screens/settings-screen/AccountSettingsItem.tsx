import type { ComponentType } from 'react'

import type { ImageSourcePropType } from 'react-native'
import type { SvgProps } from 'react-native-svg'

import { Button } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { SettingsRowLabel } from './SettingRowLabel'
import { SettingsRow } from './SettingsRow'
import { SettingsRowDescription } from './SettingsRowDescription'

type AccountSettingsItemProps = {
  title: string
  titleIconSource: ImageSourcePropType
  description: string
  buttonTitle: string
  buttonIcon: ComponentType<SvgProps>
  onPress?: () => void
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  root: {
    marginBottom: spacing(6)
  },
  button: {
    marginVertical: spacing(2)
  },
  buttonIcon: {
    marginRight: spacing(3)
  }
}))

export const AccountSettingsItem = (props: AccountSettingsItemProps) => {
  const {
    title,
    titleIconSource,
    description,
    buttonTitle,
    buttonIcon,
    onPress
  } = props
  const styles = useStyles()

  return (
    <SettingsRow style={styles.root}>
      <SettingsRowLabel label={title} iconSource={titleIconSource} />
      <SettingsRowDescription>{description}</SettingsRowDescription>
      <Button
        styles={{ root: styles.button, icon: styles.buttonIcon }}
        title={buttonTitle}
        icon={buttonIcon}
        iconPosition='left'
        variant='commonAlt'
        fullWidth
        onPress={onPress}
      />
    </SettingsRow>
  )
}
