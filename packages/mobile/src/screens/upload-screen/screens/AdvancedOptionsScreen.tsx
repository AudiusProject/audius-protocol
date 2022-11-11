import { View } from 'react-native'

import IconIndent from 'app/assets/images/iconIndent.svg'
import { makeStyles } from 'app/styles'

import { UploadStackScreen } from '../UploadStackScreen'
import {
  IsrcField,
  LicenseTypeField,
  ReleaseDateField,
  SubmenuList,
  TrackVisibilityField
} from '../fields'

const useStyles = makeStyles(({ spacing }) => ({
  content: {
    marginTop: spacing(6),
    paddingHorizontal: spacing(4)
  }
}))

const messages = {
  screenTitle: 'Advanced'
}

export const AdvancedOptionsScreen = () => {
  const styles = useStyles()
  return (
    <UploadStackScreen
      title={messages.screenTitle}
      icon={IconIndent}
      bottomSection={null}
      variant='white'
    >
      <View style={styles.content}>
        <SubmenuList>
          <TrackVisibilityField />
        </SubmenuList>
        <ReleaseDateField />
        <SubmenuList>
          <IsrcField />
          <LicenseTypeField />
        </SubmenuList>
      </View>
    </UploadStackScreen>
  )
}
