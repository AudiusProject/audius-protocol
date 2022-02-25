import { ReactNode, useCallback } from 'react'

import { Image, Text, View } from 'react-native'

import Sophisticated from 'app/assets/images/emojis/face-with-monocle.png'
import Button, { ButtonType } from 'app/components/button'
import { EmptyCard } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { font, makeStyles } from 'app/styles'

const messages = {
  afterSaved: "Once you have, this is where you'll find them!",
  goToTrending: 'Go to Trending'
}

type EmptyTabProps = {
  message: string | ReactNode
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  tabContainer: {
    backgroundColor: palette.white,
    borderRadius: 6,
    paddingVertical: spacing(8),
    paddingHorizontal: spacing(6)
  },
  tabText: {
    ...font('medium'),
    fontSize: 16,
    lineHeight: 26,
    letterSpacing: 0.2,
    marginBottom: spacing(4),
    color: palette.neutral,
    textAlign: 'center'
  }
}))

export const EmptyTab = ({ message }: EmptyTabProps) => {
  const navigation = useNavigation()
  const styles = useStyles()

  const onPress = useCallback(() => {
    navigation.navigate({
      native: { screen: 'trending', params: undefined },
      web: { route: 'trending' }
    })
  }, [navigation])

  return (
    <View style={{ marginVertical: 8 }}>
      <EmptyCard>
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <Text style={styles.tabText}>{message}</Text>
          <Image
            style={{
              position: 'relative',
              height: 20,
              width: 20,
              marginLeft: 4
            }}
            source={Sophisticated}
          />
        </View>
        <Text
          style={[
            styles.tabText,
            { width: 220, alignSelf: 'center', marginBottom: 24 }
          ]}
        >
          {messages.afterSaved}
        </Text>
        <Button
          type={ButtonType.PRIMARY}
          title={messages.goToTrending}
          containerStyle={{ width: 'auto', alignSelf: 'center' }}
          style={{ paddingHorizontal: 32 }}
          onPress={onPress}
        />
      </EmptyCard>
    </View>
  )
}
