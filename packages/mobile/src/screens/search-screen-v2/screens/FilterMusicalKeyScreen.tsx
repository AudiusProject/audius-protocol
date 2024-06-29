import { SegmentedControl } from 'app/components/core'
import { ListSelectionScreen } from 'app/screens/list-selection-screen/ListSelectionScreen'
import { useCallback, useState } from 'react'
import { useSearchFilter } from '../searchState'
import { MUSICAL_KEYS } from '@audius/common/utils'
import { Flex } from '@audius/harmony-native'

const messages = {
  title: 'Key',
  major: 'Major',
  minor: 'Minor'
}

const musicalKeys = MUSICAL_KEYS.map((key) => {
  const keys = key.split('/')
  const isEnharmonic = keys.length > 1
  const [_sharp, flat] = keys

  return {
    label: key,
    value: isEnharmonic ? flat : key
  }
})

export const FilterMusicalKeyScreen = () => {
  const [musicalKey, setMusicalKey, clearMusicalKey] = useSearchFilter('key')
  const [initialKey, initialScale] = musicalKey?.split(' ') ?? []
  const [key, setKey] = useState(initialKey)
  const [scale, setScale] = useState(initialScale)

  const handleSubmit = useCallback(() => {
    if (key && scale) {
      setMusicalKey(`${key} ${scale}`)
    } else {
      clearMusicalKey()
    }
  }, [])

  const handleClear = useCallback(() => {
    setScale('Major')
    setKey('')
  }, [])

  return (
    <ListSelectionScreen
      screenTitle={messages.title}
      header={
        <Flex p='l'>
          <SegmentedControl
            options={[
              { key: 'Major', text: messages.major },
              { key: 'Minor', text: messages.minor }
            ]}
            selected={scale}
            onSelectOption={setScale}
            fullWidth
            equalWidth
          />
        </Flex>
      }
      disableSearch
      data={musicalKeys}
      value={key}
      onChange={setKey}
      onSubmit={handleSubmit}
      onClear={handleClear}
    />
  )
}
