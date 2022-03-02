import { useCallback } from 'react'

import { MainParamList } from 'app/components/app-navigator/types'
import { Button, EmptyTile } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

const messages = {
  afterSaved: "Once you have, this is where you'll find them!",
  goToTrending: 'Go to Trending'
}

type EmptyTabProps = {
  message: string
}

export const EmptyTab = ({ message }: EmptyTabProps) => {
  const navigation = useNavigation<MainParamList>()

  const onPress = useCallback(() => {
    navigation.navigate({
      native: { screen: 'trending' },
      web: { route: 'trending' }
    })
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
