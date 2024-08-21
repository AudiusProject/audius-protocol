import { useGetCurrentUser } from '@audius/common/api'
import { useField } from 'formik'

import { Text } from '@audius/harmony-native'
import { ExpandableRadio } from 'app/components/edit/ExpandableRadio'
import { ExpandableRadioGroup } from 'app/components/edit/ExpandableRadioGroup'

const TARGET_AUDIENCE_FIELD = 'target_audience'

const messages = {
  followers: {
    label: 'My Followers',
    description: 'Send a bulk message to all of your followers.'
  },
  supporters: {
    label: 'Tip Supporters',
    description: 'Send a bulk message to everyone who has tipped you.'
  },
  purchasers: {
    label: 'Past Purchasers',
    description:
      'Send a bulk message to everyone who has purchased content from you on Audius.',
    placeholder: 'Premium Content'
  },
  remixCreators: {
    label: 'Remix Creators',
    description:
      'Send a bulk message to creators who have remixed your tracks.',
    placeholder: 'Tracks with Remixes'
  }
}

export const ChatBlastSelectAudienceFields = () => {
  const [{ value }, , { setValue }] = useField(TARGET_AUDIENCE_FIELD)
  return (
    <ExpandableRadioGroup value={value} onValueChange={setValue}>
      <FollowersMessageField />
      <TipSupportersMessageField />
      <PastPurchasersMessageField />
      <RemixCreatorsMessageField />
    </ExpandableRadioGroup>
  )
}

const LabelWithCount = (props: {
  label: string
  count?: number
  isSelected: boolean
}) => {
  const { label, count, isSelected } = props
  return (
    <Text>
      {label}
      {isSelected && count !== undefined ? (
        <Text color='subdued'> ({count})</Text>
      ) : null}
    </Text>
  )
}

const FollowersMessageField = () => {
  const { data: user } = useGetCurrentUser()
  const [{ value: targetAudience }] = useField(TARGET_AUDIENCE_FIELD)
  const isSelected = targetAudience === 'followers'

  return (
    <ExpandableRadio
      value='followers'
      label={
        <LabelWithCount
          label={messages.followers.label}
          count={user.follower_count}
          isSelected={isSelected}
        />
      }
      description={messages.followers.description}
    />
  )
}

const TipSupportersMessageField = () => {
  const { data: user } = useGetCurrentUser()
  const [{ value: targetAudience }] = useField(TARGET_AUDIENCE_FIELD)
  const isSelected = targetAudience === 'supporters'

  return (
    <ExpandableRadio
      value='supporters'
      label={
        <LabelWithCount
          label={messages.supporters.label}
          count={user.supporter_count}
          isSelected={isSelected}
        />
      }
      description={messages.supporters.description}
    />
  )
}

const PastPurchasersMessageField = () => {
  const { data: user } = useGetCurrentUser()
  const [{ value: targetAudience }] = useField(TARGET_AUDIENCE_FIELD)
  const isSelected = targetAudience === 'purchasers'

  return (
    <ExpandableRadio
      value='purchasers'
      label={
        <LabelWithCount
          label={messages.purchasers.label}
          // TODO: need purchasers count endpoint
          count={user.supporter_count}
          isSelected={isSelected}
        />
      }
      description={messages.purchasers.description}
    />
  )
}

const RemixCreatorsMessageField = () => {
  const { data: user } = useGetCurrentUser()
  const [{ value: targetAudience }] = useField(TARGET_AUDIENCE_FIELD)
  const isSelected = targetAudience === 'remix_creators'

  return (
    <ExpandableRadio
      value='remix_creators'
      label={
        <LabelWithCount
          label={messages.remixCreators.label}
          // TODO: need remixers count endpoint
          count={user.supporter_count}
          isSelected={isSelected}
        />
      }
      description={messages.remixCreators.description}
    />
  )
}
