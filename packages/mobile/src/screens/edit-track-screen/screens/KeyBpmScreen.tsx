import { isBpmValid } from '@audius/common/utils'
import { useField } from 'formik'
import { View } from 'react-native'

import { Flex, IconInfo, Text } from '@audius/harmony-native'
import { TextField } from 'app/components/fields'
import { FormScreen } from 'app/screens/form-screen'

import { ContextualMenuField } from '../fields/ContextualMenuField'
import { SubmenuList } from '../fields/SubmenuList'

export const BPM = 'bpm'

const messages = {
  title: 'KEY & TEMPO',
  key: 'Key',
  bpm: 'BPM',
  tempo: 'Tempo'
}

export const KeyBpmScreen = () => {
  const [bpmField, , { setValue }] = useField<string>(BPM)

  const handleChange = (value: string) => {
    if (value === '' || isBpmValid(value)) {
      setValue(value)
    }
  }

  return (
    <FormScreen title={messages.title} icon={IconInfo} variant='white'>
      <View>
        <SubmenuList>
          <ContextualMenuField
            name='musical_key'
            menuScreenName='SelectKey'
            label={messages.key}
          />
        </SubmenuList>
        <Flex>
          <Flex ph='l'>
            <Text size='l' strength='strong' variant='body'>
              {messages.tempo}
            </Text>
          </Flex>
          <TextField
            name={BPM}
            label={messages.bpm}
            value={
              typeof bpmField.value !== 'undefined'
                ? String(bpmField.value)
                : undefined
            }
            onChangeText={handleChange}
            keyboardType='numeric'
          />
        </Flex>
      </View>
    </FormScreen>
  )
}
