import { useCallback } from 'react'

import IconTwitterBird from 'app/assets/images/iconTwitterBird.svg'
import { Button, ButtonProps } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { make, track } from 'app/utils/analytics'
import { getTwitterLink } from 'app/utils/twitter'

const messages = {
  share: 'Share to Twitter'
}

const useStyles = makeStyles(({ palette }) => ({
  root: {
    backgroundColor: palette.staticTwitterBlue
  }
}))

type TwitterButtonProps = Partial<ButtonProps> & {
  shareText: string
  analytics?: ReturnType<typeof make>
}

export const TwitterButton = (props: TwitterButtonProps) => {
  const { url = null, shareText, analytics, ...other } = props
  const styles = useStyles()

  const twitterUrl = getTwitterLink(url, shareText)

  const onPress = useCallback(() => {
    if (analytics) {
      track(analytics)
    }
  }, [analytics])

  return (
    <Button
      title={messages.share}
      style={styles.root}
      icon={IconTwitterBird}
      iconPosition='left'
      url={twitterUrl}
      onPress={onPress}
      {...other}
    />
  )
}
