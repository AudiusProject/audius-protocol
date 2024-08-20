import { chatActions } from '@audius/common/store'
import { ChatBlastAudience } from '@audius/sdk'
import { Formik } from 'formik'
import { useDispatch } from 'react-redux'

import { Button, Flex, IconTowerBroadcast } from '@audius/harmony-native'
import { HeaderShadow } from 'app/components/core'

import { FormScreen } from '../form-screen'

import { ChatBlastSelectAudienceFields } from './ChatBlastSelectAudienceFields'
const { createChatBlast } = chatActions

const messages = {
  title: 'Select Audience',
  continue: 'Continue'
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
      {({ submitForm }) => (
        <FormScreen
          title={messages.title}
          icon={IconTowerBroadcast}
          bottomSection={
            <Button variant='primary' fullWidth onPress={submitForm}>
              {messages.continue}
            </Button>
          }
          variant='white'
        >
          <Flex gap='2xl'>
            <HeaderShadow />
            <ChatBlastSelectAudienceFields />
          </Flex>
        </FormScreen>
      )}
    </Formik>
  )
}
