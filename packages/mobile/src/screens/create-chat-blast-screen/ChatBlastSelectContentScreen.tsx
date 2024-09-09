import { useCallback, useState } from 'react'

import { useField, useFormikContext } from 'formik'
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view'

import type { TextInputChangeEvent } from '@audius/harmony-native'
import {
  Flex,
  Radio,
  RadioGroup,
  Text,
  TextInput
} from '@audius/harmony-native'
import { ScreenContent } from 'app/components/core'
import { useRoute } from 'app/hooks/useRoute'

import { FormScreen } from '../form-screen'

const renderItem = ({ item }) => {
  return (
    <Flex row ph='xl' pv='l' backgroundColor='white' borderBottom='default'>
      <Radio
        value={item.label}
        label={
          <Text variant='title' size='l' strength='weak'>
            {item.label}
          </Text>
        }
      />
    </Flex>
  )
}

export const ChatBlastSelectContentScreen = () => {
  const { params } = useRoute<'ChatBlastSelectContent'>()
  const { valueName, title, searchLabel, content } = params
  const [{ value }, , { setValue }] = useField({
    name: valueName,
    type: 'select'
  })
  const { submitForm } = useFormikContext()
  const [search, setSearch] = useState('')
  const filteredOptions = content.filter((option) => {
    return search
      ? option.label.toLowerCase().includes(search.toLowerCase())
      : true
  })
  const radioGroupValue = value ?? ''

  const handleClear = useCallback(() => {
    setValue(undefined)
  }, [setValue])

  const handleSearchChange = useCallback(
    (e: TextInputChangeEvent) => {
      setSearch(e.nativeEvent.text)
    },
    [setSearch]
  )

  return (
    <FormScreen
      title={title}
      clearable
      onClear={handleClear}
      onSubmit={submitForm}
    >
      <ScreenContent>
        {/* TODO: 70% bad */}
        <Flex justifyContent='flex-start' h='70%'>
          <Flex p='l' backgroundColor='white' justifyContent='flex-start'>
            <TextInput
              label={searchLabel}
              value={search}
              onChange={handleSearchChange}
            />
          </Flex>
          <RadioGroup value={radioGroupValue} onValueChange={setValue}>
            <KeyboardAwareFlatList
              data={filteredOptions}
              keyExtractor={(item) => item.label}
              renderItem={renderItem}
            />
          </RadioGroup>
        </Flex>
      </ScreenContent>
    </FormScreen>
  )
}
