import { accountSelectors } from '@audius/common'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import IconTip from 'app/assets/images/iconTip.svg'
import { Divider, Text } from 'app/components/core'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'
import { useThemeColors } from 'app/utils/theme'

import { useSelectProfile } from '../selectors'

import { Bio } from './Bio'
import { ProfileMutualsButton } from './ProfileMutualsButton'
import { ProfileTierTile } from './ProfileTierTile'
import { SocialsAndSites } from './SocialsAndSites'
import { SupportingList } from './SupportingList'
const getUserId = accountSelectors.getUserId

const messages = {
  supporting: 'Supporting'
}

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  titleContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: spacing(3)
  },
  divider: {
    marginLeft: spacing(3),
    flex: 1
  },
  text: {
    ...typography.h3,
    color: palette.neutral
  },
  icon: {
    marginRight: spacing(1.5),
    position: 'relative',
    bottom: 2
  }
}))

const SupportingSectionTitle = () => {
  const styles = useStyles()
  const { neutral } = useThemeColors()
  return (
    <View style={styles.titleContainer}>
      <IconTip height={18} width={18} fill={neutral} style={styles.icon} />
      <Text style={styles.text}>{messages.supporting}</Text>
      <Divider style={styles.divider} />
    </View>
  )
}

export const ExpandedSection = () => {
  const { supporting_count, user_id, current_user_followee_follow_count } =
    useSelectProfile([
      'supporting_count',
      'user_id',
      'current_user_followee_follow_count'
    ])
  const accountId = useSelector(getUserId)
  const isOwner = user_id === accountId

  return (
    <View pointerEvents='box-none'>
      <Bio />
      <SocialsAndSites />
      <View style={{ flexDirection: 'row', marginVertical: spacing(2) }}>
        <ProfileTierTile />
        {isOwner || current_user_followee_follow_count === 0 ? null : (
          <ProfileMutualsButton />
        )}
      </View>
      {supporting_count > 0 ? (
        <>
          <SupportingSectionTitle />
          <SupportingList />
        </>
      ) : null}
    </View>
  )
}
