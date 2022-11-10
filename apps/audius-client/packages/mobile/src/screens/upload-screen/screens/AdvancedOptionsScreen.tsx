import IconIndent from 'app/assets/images/iconIndent.svg'
import { makeStyles } from 'app/styles'

import { UploadStackScreen } from '../UploadStackScreen'
import { SubmenuList, TrackVisibilityField } from '../fields'

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
      <SubmenuList style={styles.content}>
        <TrackVisibilityField />
      </SubmenuList>
    </UploadStackScreen>
  )
}
