import { ChallengeRewardID } from 'audius-client/src/common/models/AudioRewards'
import { ChallengeReward as ChallengeRewardNotification } from 'audius-client/src/common/store/notifications/types'
import { StyleSheet, Text, View } from 'react-native'

import { useTheme } from 'app/utils/theme'

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
  notification: ChallengeRewardNotification
}

const challengeInfoMap: Record<
  ChallengeRewardID,
  { title: string; amount: number }
> = {
  'profile-completion': {
    title: '✅️ Complete your Profile',
    amount: 1
  },
  'listen-streak': {
    title: '🎧 Listening Streak: 7 Days',
    amount: 1
  },
  'track-upload': {
    title: '🎶 Upload 3 Tracks',
    amount: 1
  },
  referrals: {
    title: '📨 Invite your Friends',
    amount: 1
  },
  'ref-v': {
    title: '📨 Invite your Fans',
    amount: 1
  },
  referred: {
    title: '📨 Invite your Friends',
    amount: 1
  },
  'connect-verified': {
    title: '✅️ Link Verified Accounts',
    amount: 5
  },
  'mobile-install': {
    title: '📲 Get the App',
    amount: 1
  },
  'send-first-tip': {
    title: '🤑 Send Your First Tip',
    amount: 2
  },
  'first-playlist': {
    title: '✨ Create Your First Playlist',
    amount: 2
  }
}

const ChallengeReward = (props: ChallengeRewardProps) => {
  const { notification } = props
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
