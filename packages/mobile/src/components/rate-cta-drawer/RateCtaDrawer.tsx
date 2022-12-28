import { Name } from '@audius/common'
import { View } from 'react-native'
import InAppReview from 'react-native-in-app-review'

import IconHeart from 'app/assets/images/iconHeart.svg'
import IconThumbsDown from 'app/assets/images/iconThumbsDown.svg'
import IconThumbsUp from 'app/assets/images/iconThumbsUp.svg'
import { Button, Text } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
import { RATE_CTA_STORAGE_KEY } from 'app/constants/storage-keys'
import { useAsyncStorage } from 'app/hooks/useAsyncStorage'
import { make, track } from 'app/services/analytics'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

const DRAWER_NAME = 'RateCallToAction'

const messages = {
  drawerTitle: 'Enjoying the App?',
  cancelText: 'No',
  confirmText: 'Yes!',
  enjoyingText: 'Are You Enjoying Audius Music?',
  thankYouText: 'Thanks For The Feedback!'
}

const useStyles = makeStyles(({ palette, typography, spacing }) => ({
  contentContainer: {
    paddingHorizontal: spacing(4),
    paddingBottom: spacing(4)
  },
  title: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing(2),
    paddingBottom: spacing(6)
  },
  titleIcon: {
    position: 'relative',
    top: 7,
    color: palette.neutral,
    marginRight: spacing(3)
  },
  titleText: {
    textTransform: 'uppercase',
    marginTop: spacing(4)
  },
  buttonRoot: {
    marginTop: spacing(4)
  },
  buttonIcon: {
    height: 18,
    width: 18,
    marginRight: spacing(2)
  },
  buttonText: {
    fontSize: typography.fontSize.large
  },
  text: {
    textAlign: 'center',
    fontSize: typography.fontSize.large
  }
}))

export const RateCtaDrawer = () => {
  const styles = useStyles()
  const { neutralLight2 } = useThemeColors()
  const [userRateResponse, setUserRateResponse] = useAsyncStorage(
    RATE_CTA_STORAGE_KEY,
    null
  )

  const handleReviewConfirm = () => {
    const isAvailable = InAppReview.isAvailable()

    if (isAvailable) {
      InAppReview.RequestInAppReview()
        .then((hasFlowFinishedSuccessfully) => {
          setUserRateResponse('YES')
          track(make({ eventName: Name.RATE_CTA_RESPONSE_YES }))
        })
        .catch((error) => {
          console.log(error)
        })
    }
  }

  const handleReviewDeny = () => {
    track(make({ eventName: Name.RATE_CTA_RESPONSE_NO }))
    setUserRateResponse('NO')
  }

  return (
    <NativeDrawer drawerName={DRAWER_NAME}>
      <View style={styles.contentContainer}>
        <View style={styles.title}>
          <IconHeart
            style={styles.titleIcon}
            fill={neutralLight2}
            height={24}
            width={24}
          />
          <Text
            weight='heavy'
            color='neutralLight2'
            fontSize='xl'
            style={styles.titleText}
          >
            {messages.drawerTitle}
          </Text>
        </View>
        {userRateResponse !== null ? (
          <Text variant='body' style={styles.text}>
            {messages.thankYouText}
          </Text>
        ) : (
          <>
            <Text variant='body' style={styles.text}>
              {messages.enjoyingText}
            </Text>
            <Button
              title={messages.confirmText}
              icon={IconThumbsUp}
              iconPosition='left'
              fullWidth
              styles={{
                root: styles.buttonRoot,
                icon: styles.buttonIcon,
                text: styles.buttonText
              }}
              variant='common'
              onPress={handleReviewConfirm}
            />
            <Button
              title={messages.cancelText}
              icon={IconThumbsDown}
              iconPosition='left'
              fullWidth
              styles={{
                root: styles.buttonRoot,
                icon: styles.buttonIcon,
                text: styles.buttonText
              }}
              variant='common'
              onPress={handleReviewDeny}
            />
          </>
        )}
      </View>
    </NativeDrawer>
  )
}
