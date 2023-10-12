import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import * as signOnActions from 'common/store/pages/signon/actions'
import {
  getEmailField,
  getHandleField,
  getFollowArtists
} from 'common/store/pages/signon/selectors'
import type {
  FollowArtists,
  EditableField
} from 'common/store/pages/signon/types'
import { useDispatch, useSelector } from 'react-redux'

import { SafeAreaScreen, ScreenContent } from 'app/components/core'
import { SuggestedFollows } from 'app/components/suggested-follows'
import { track, make } from 'app/services/analytics'
import { EventNames } from 'app/types/analytics'

import type { SignOnStackParamList } from './types'

const messages = {
  title: 'Follow At Least 3 Artists To Get Started'
}

export type FirstFollowsProps = NativeStackScreenProps<
  SignOnStackParamList,
  'FirstFollows'
>

const FirstFollows = (props: FirstFollowsProps) => {
  const { navigation } = props
  const dispatch = useDispatch()

  const emailField: EditableField = useSelector(getEmailField)
  const handleField: EditableField = useSelector(getHandleField)
  const followArtists: FollowArtists = useSelector(getFollowArtists)
  const { selectedUserIds: followedArtistIds } = followArtists

  const handleArtistsSelected = () => {
    dispatch(signOnActions.finishSignUp())

    track(
      make({
        eventName: EventNames.CREATE_ACCOUNT_COMPLETE_FOLLOW,
        emailAddress: emailField.value,
        handle: handleField.value,
        users: followedArtistIds.join('|'),
        count: followedArtistIds.length
      })
    )

    navigation.push('SignupLoadingPage')
  }

  return (
    <SafeAreaScreen>
      <ScreenContent>
        <SuggestedFollows
          title={messages.title}
          onArtistsSelected={handleArtistsSelected}
          screen='sign-on'
        />
      </ScreenContent>
    </SafeAreaScreen>
  )
}

export default FirstFollows
