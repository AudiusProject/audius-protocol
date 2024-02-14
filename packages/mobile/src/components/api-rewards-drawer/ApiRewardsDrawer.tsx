import { AUDIUS_API_LINK } from 'audius-client/src/utils/route'
import type { ImageStyle } from 'react-native'
import { Image, View } from 'react-native'

import { IconArrowRight } from '@audius/harmony-native'
import AudiusAPI from 'app/assets/images/audiusAPI.png'
import { Button, GradientText } from 'app/components/core'
import { AppDrawer } from 'app/components/drawer'
import Text from 'app/components/text'
import { makeStyles } from 'app/styles'

const messages = {
  modalTitle: 'Audius API',
  title: "It's easy to build your own app on Audius",
  description: 'The top 10 Audius API apps each month win',
  button: 'Learn More'
}

const MODAL_NAME = 'APIRewardsExplainer'

const useStyles = makeStyles(({ palette, spacing, typography }) => ({
  content: {
    padding: spacing(6),
    display: 'flex',
    alignItems: 'center'
  },
  drawerTitle: {
    marginTop: spacing(2),
    marginBottom: spacing(8),
    fontSize: typography.fontSize.xxxl
  },
  image: {
    height: 100,
    width: 120,
    marginBottom: spacing(8)
  },
  title: {
    marginBottom: spacing(6),
    color: palette.secondary,
    fontSize: typography.fontSize.xxl,
    textAlign: 'center'
  },
  subtitle: {
    color: palette.neutralLight4,
    marginBottom: spacing(6)
  },
  button: {
    paddingHorizontal: spacing(2)
  },
  buttonText: {
    fontSize: typography.fontSize.medium
  }
}))

export const ApiRewardsDrawer = () => {
  const styles = useStyles()

  return (
    <AppDrawer modalName={MODAL_NAME}>
      <View style={styles.content}>
        <GradientText style={styles.drawerTitle}>
          {messages.modalTitle}
        </GradientText>
        <Image style={styles.image as ImageStyle} source={AudiusAPI} />
        <Text style={styles.title} weight='bold'>
          {messages.title}
        </Text>
        <Text style={styles.subtitle} weight='bold'>
          {messages.description}
        </Text>
        <Button
          variant='primary'
          size='large'
          icon={IconArrowRight}
          title={messages.button}
          url={AUDIUS_API_LINK}
          styles={{ button: styles.button, text: styles.buttonText }}
          fullWidth
        />
      </View>
    </AppDrawer>
  )
}
