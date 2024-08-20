import { useGetCurrentUser } from '@audius/common/api'
import { chatActions } from '@audius/common/store'
import { ChatBlastAudience } from '@audius/sdk'
import { Formik } from 'formik'
import { useDispatch } from 'react-redux'

import { Text } from '@audius/harmony-native'
import { ExpandableRadio } from 'app/components/edit/ExpandableRadio'
import { ExpandableRadioGroup } from 'app/components/edit/ExpandableRadioGroup'

import { FormScreen } from '../form-screen'
const { createChatBlast } = chatActions

const TARGET_AUDIENCE_FIELD = 'target_audience'

const messages = {
  title: 'Target Audience',
  back: 'Back',
  continue: 'Continue',
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

type ChatBlastFormValues = {
  target_audience: 'followers' | 'supporters' | 'purchasers' | 'remix_creators'
  purchased_track_id?: string
  remixed_track_id?: string
}

export const ChatBlastSelectAudienceScreen = () => {
  const dispatch = useDispatch()
  const initialValues: ChatBlastFormValues = {
    target_audience: 'followers',
    purchased_track_id: undefined,
    remixed_track_id: undefined
  }

  const handleSubmit = (values: ChatBlastFormValues) => {
    switch (values.target_audience) {
      case 'followers':
        dispatch(
          createChatBlast({
            audience: ChatBlastAudience.FOLLOWERS
          })
        )
        break
      case 'supporters':
        // do something
        break
      case 'purchasers':
        // do something
        break
      case 'remix_creators':
        // do something
        break
      default:
        break
    }
  }

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ getFieldProps }) => (
        <FormScreen>
          <ExpandableRadioGroup {...getFieldProps(TARGET_AUDIENCE_FIELD)}>
            <FollowersMessageField />
            <TipSupportersMessageField />
            <PastPurchasersMessageField />
            <RemixCreatorsMessageField />
          </ExpandableRadioGroup>
        </FormScreen>
      )}
    </Formik>
  )
}

const LabelWithCount = (props: { label: string; count: number }) => {
  const { label, count } = props
  return (
    <Text>
      {label} <Text color='subdued'>({count})</Text>
    </Text>
  )
}

const FollowersMessageField = () => {
  const { data: user } = useGetCurrentUser()
  const { follower_count: followerCount } = user ?? { follower_count: 0 }

  return (
    <ExpandableRadio
      value='followers'
      label={
        <LabelWithCount
          label={messages.followers.label}
          count={followerCount}
        />
      }
      description={messages.followers.description}
    />
  )
}

const TipSupportersMessageField = () => {
  const { data: user } = useGetCurrentUser()
  const { supporter_count: supporterCount } = user ?? { supporter_count: 0 }

  return (
    <ExpandableRadio
      value='supporters'
      label={
        <LabelWithCount
          label={messages.supporters.label}
          count={supporterCount}
        />
      }
      description={messages.supporters.description}
    />
  )
}

const PastPurchasersMessageField = () => {
  const { data: user } = useGetCurrentUser()
  // TODO: need purchasers count endpoint
  const { supporter_count: supporterCount } = user ?? { supporter_count: 0 }

  return (
    <ExpandableRadio
      value='purchasers'
      label={
        <LabelWithCount
          label={messages.purchasers.label}
          count={supporterCount}
        />
      }
      description={messages.purchasers.description}
    />
  )
}

const RemixCreatorsMessageField = () => {
  const { data: user } = useGetCurrentUser()
  // TODO: need remixers count endpoint
  const { supporter_count: supporterCount } = user ?? { supporter_count: 0 }

  return (
    <ExpandableRadio
      value='remix_creators'
      label={
        <LabelWithCount
          label={messages.remixCreators.label}
          count={supporterCount}
        />
      }
      description={messages.remixCreators.description}
    />
  )
}
