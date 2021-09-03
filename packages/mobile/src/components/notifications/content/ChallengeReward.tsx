import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../../../utils/theme'
import {
  ChallengeReward as ChallengeRewardType,
  ChallengeRewardID
} from 'store/notifications/types'
import TwitterShare from './TwitterShare'

const styles = StyleSheet.create({
  wrapper: {
    display: 'flex',
    flexDirection: 'column'
  },
  text: {
    fontFamily: 'AvenirNextLTPro-Bold',
    fontSize: 16,
    marginBottom: 8
  }
})

type ChallengeRewardProps = {
  notification: ChallengeRewardType
  onGoToRoute: (route: string) => void
}

const challengeInfoMap: Record<
  ChallengeRewardID,
  { title: string; amount: number }
> = {
  'profile-completion': {
    title: '✅️ Complete your Profile',
    amount: 5
  },
  'listen-streak': {
    title: '🎧 Listening Streak: 7 Days',
    amount: 5
  },
  'track-upload': {
    title: '🎶 Upload 5 Tracks',
    amount: 5
  },
  referrals: {
    title: '📨 Invite your Friends',
    amount: 1
  },
  referred: {
    title: '📨 Invite your Friends',
    amount: 1
  },
  'connect-verified': {
    title: '✅️ Link Verified Accounts',
    amount: 10
  },
  'mobile-install': {
    title: '📲 Get the App',
    amount: 10
  }
}

const ChallengeReward = ({
  notification,
  onGoToRoute
}: ChallengeRewardProps) => {
  const { challengeId } = notification

  const mainTextStyle = useTheme(styles.text, {
    color: 'secondary'
  })

  const infoTextStyle = useTheme(styles.text, {
    color: 'neutral'
  })

  const rewardText =
    challengeId === 'referred'
      ? `You’ve earned ${challengeInfoMap[challengeId].amount} $AUDIO for being referred! Invite your friends to join to earn more!`
      : `You’ve earned ${challengeInfoMap[challengeId].amount} $AUDIO for completing this challenge!`

  return (
    <View style={styles.wrapper}>
      <Text style={mainTextStyle}>{challengeInfoMap[challengeId].title}</Text>
      <Text style={infoTextStyle}>{rewardText}</Text>
      <TwitterShare notification={notification} />
    </View>
  )
}

export default ChallengeReward
