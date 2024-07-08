import { useCallback } from 'react'

import { Button, EmptyTile } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

const messages = {
  afterSaved: "Once you have, this is where you'll find them!",
  goToTrending: 'Go to Trending'
}

type EmptyTabProps = {
  message: string
}

export const EmptyTileCTA = (props: EmptyTabProps) => {
  const { message } = props
  const navigation = useNavigation()

  const onPress = useCallback(() => {
    navigation.navigate('trending')
  }, [navigation])

  return (
    <EmptyTile message={message} secondaryMessage={messages.afterSaved}>
      <Button
        variant='primary'
        size='large'
        title={messages.goToTrending}
        onPress={onPress}
      />
    </EmptyTile>
  )
}
