import { useCallback, useState } from 'react'

import { MUSICAL_KEYS } from '@audius/common/utils'

import { SegmentedControl } from 'app/components/core'
import { ListSelectionScreen } from 'app/screens/list-selection-screen/ListSelectionScreen'

import { useSearchFilter } from '../searchState'

const messages = {
  title: 'Key',
  major: 'Major',
  minor: 'Minor'
}

const musicalKeys = MUSICAL_KEYS.map((key) => {
  const keys = key.split('/')
  const isEnharmonic = keys.length > 1
  const [sharpIgnored, flat] = keys

  return {
    label: key,
    value: isEnharmonic ? flat : key
  }
})

export const FilterMusicalKeyScreen = () => {
  const [musicalKey, setMusicalKey, clearMusicalKey] = useSearchFilter('key')
  const [initialKey, initialScale = 'Major'] = musicalKey?.split(' ') ?? []
  const [key, setKey] = useState(initialKey)
  const [scale, setScale] = useState(initialScale)

  const handleSubmit = useCallback(() => {
    if (key && scale) {
      setMusicalKey(`${key} ${scale}`)
    } else {
      clearMusicalKey()
    }
  }, [key, scale, setMusicalKey, clearMusicalKey])

  const handleClear = useCallback(() => {
    setScale('Major')
    setKey('')
  }, [])

  return (
    <ListSelectionScreen
      screenTitle={messages.title}
      header={
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
      }
      disableSearch
      data={musicalKeys}
      value={key}
      onChange={setKey}
      onSubmit={handleSubmit}
      onClear={handleClear}
      clearable={Boolean(key && scale)}
    />
  )
}
