import { useCallback, useState } from 'react'

import type { Nullable } from '@audius/common'
import { Name } from '@audius/common'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { View } from 'react-native'
import InAppReview from 'react-native-in-app-review'

import { IconHeart } from '@audius/harmony-native'
import { IconThumbsDown } from '@audius/harmony-native'
import { IconThumbsUp } from '@audius/harmony-native'
import { Button, Text } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
import { RATE_CTA_STORAGE_KEY } from 'app/constants/storage-keys'
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
  const [userRateResponse, setUserRateResponse] =
    useState<Nullable<'YES' | 'NO'>>(null)

  const handleReviewConfirm = useCallback(() => {
    const isAvailable = InAppReview.isAvailable()
    track(make({ eventName: Name.RATE_CTA_RESPONSE_YES }))
    setUserRateResponse('YES')
    AsyncStorage.setItem(RATE_CTA_STORAGE_KEY, 'YES')

    if (isAvailable) {
      InAppReview.RequestInAppReview()
        .then((hasFlowFinishedSuccessfully) => {
          // Do things after the popup shows up
        })
        .catch((error) => {
          console.error(error)
        })
    }
  }, [])

  const handleReviewDeny = useCallback(() => {
    track(make({ eventName: Name.RATE_CTA_RESPONSE_NO }))
    setUserRateResponse('NO')
    AsyncStorage.setItem(RATE_CTA_STORAGE_KEY, 'NO')
  }, [])

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
              variant='commonAlt'
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
              variant='commonAlt'
              onPress={handleReviewDeny}
            />
          </>
        )}
      </View>
    </NativeDrawer>
  )
}
