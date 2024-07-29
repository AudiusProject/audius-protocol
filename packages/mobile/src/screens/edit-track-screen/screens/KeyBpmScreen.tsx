import { useField, useFormikContext } from 'formik'
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
  const { setFieldValue } = useFormikContext()
  const [bpmField, , { setValue }] = useField<number>(BPM)

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
            value={
              typeof bpmField.value !== 'undefined'
                ? String(bpmField.value)
                : undefined
            }
            onChangeText={(text) => {
              const maxLength = text.includes('.') ? text.indexOf('.') + 2 : 3
              console.log({ text, maxLength, len: text.length })

              if (text.length > maxLength) {
                const newVal = Number(text.slice(0, maxLength))
                setValue(newVal)
                // setFieldValue(BPM, newVal)
              }
            }}
            keyboardType='numeric'
            label={messages.bpm}
          />
        </Flex>
      </View>
    </FormScreen>
  )
}
