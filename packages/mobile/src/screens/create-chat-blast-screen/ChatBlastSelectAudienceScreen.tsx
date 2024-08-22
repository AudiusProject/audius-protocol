import { chatActions } from '@audius/common/store'
import { ChatBlastAudience } from '@audius/sdk'
import { Formik } from 'formik'
import { useDispatch } from 'react-redux'

import { Button, Flex, IconTowerBroadcast } from '@audius/harmony-native'
import { HeaderShadow } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

import { FormScreen } from '../form-screen'

import { ChatBlastSelectAudienceFields } from './ChatBlastSelectAudienceFields'
const { createChatBlast } = chatActions

const messages = {
  title: 'Select Audience',
  continue: 'Continue'
}

type ChatBlastFormValues = {
  target_audience: ChatBlastAudience
  purchased_content_id?: string
  remixed_track_id?: string
}

export const ChatBlastSelectAudienceScreen = () => {
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const initialValues: ChatBlastFormValues = {
    target_audience: ChatBlastAudience.FOLLOWERS,
    purchased_content_id: undefined,
    remixed_track_id: undefined
  }

  const handleSubmit = (values: ChatBlastFormValues) => {
    dispatch(
      createChatBlast({
        audience: values.target_audience,
        audienceContentId: values.purchased_content_id,
        // TODO: collection support
        audienceContentType: values.purchased_content_id ? 'track' : undefined
      })
    )
    navigation.navigate('ChatList')
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
          <Flex gap='l'>
            <HeaderShadow />
            <ChatBlastSelectAudienceFields />
          </Flex>
        </FormScreen>
      )}
    </Formik>
  )
}
