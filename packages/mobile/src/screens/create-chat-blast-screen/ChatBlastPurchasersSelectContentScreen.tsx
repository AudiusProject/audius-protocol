import { useCallback, useState } from 'react'

import { usePurchasersAudience } from '@audius/common/hooks'
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

import { FormScreen } from '../form-screen'

const messages = {
  title: 'Tracks With Purchases',
  done: 'Done',
  clear: 'Clear',
  search: 'Search for tracks with purchases'
}

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

export const ChatBlastPurchasersSelectContentScreen = () => {
  const [{ value }, , { setValue: setPurchasedContentMetadata }] = useField({
    name: 'purchased_content_metadata',
    type: 'select'
  })
  const { submitForm } = useFormikContext()
  const { premiumContentOptions } = usePurchasersAudience({})
  const [search, setSearch] = useState('')
  const filteredOptions = premiumContentOptions.filter((option) => {
    return search
      ? option.label.toLowerCase().includes(search.toLowerCase())
      : true
  })
  const radioGroupValue = value ?? ''

  const handleClear = useCallback(() => {
    setPurchasedContentMetadata(undefined)
  }, [setPurchasedContentMetadata])

  const handleSearchChange = useCallback(
    (e: TextInputChangeEvent) => {
      setSearch(e.nativeEvent.text)
    },
    [setSearch]
  )

  return (
    <FormScreen
      title={messages.title}
      clearable
      onClear={handleClear}
      onSubmit={submitForm}
    >
      <ScreenContent>
        {/* TODO: 70% bad */}
        <Flex justifyContent='flex-start' h='70%'>
          <Flex p='l' backgroundColor='white' justifyContent='flex-start'>
            <TextInput
              label={messages.search}
              value={search}
              onChange={handleSearchChange}
            />
          </Flex>
          <RadioGroup
            value={radioGroupValue}
            onValueChange={setPurchasedContentMetadata}
          >
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
