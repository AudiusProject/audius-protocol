import { useState } from 'react'

import { MUSICAL_KEYS } from '@audius/common/utils'
import {
  Box,
  Divider,
  FilterButtonOptions,
  Flex,
  Paper,
  Popup,
  SegmentedControl,
  SelectInput
} from '@audius/harmony'
import { useField } from 'formik'

const messages = {
  key: 'Key'
}

type KeySelectFieldProps = {
  name: string
}

export const KeySelectField = (props: KeySelectFieldProps) => {
  const { name } = props
  const [field, { touched, error }, { setValue }] = useField(name)

  const hasError = Boolean(touched && error)

  const [scale, setScale] = useState<'Major' | 'Minor'>('Major')
  const keyOptions = MUSICAL_KEYS.map((key) => {
    const keyParts = key.split('/')
    return {
      label: key,
      // If the key is an enharmonic equivalent (e.g. C# and Db), use the flat as the value
      value: keyParts.length > 1 ? keyParts[1] : key
    }
  })

  const key = field.value

  return (
    <SelectInput
      value={key}
      label={messages.key}
      error={hasError}
      helperText={hasError ? error : undefined}
      onChange={setValue}
    >
      {({ handleChange, isOpen, setIsOpen, anchorRef }) => (
        <Popup
          anchorRef={anchorRef}
          isVisible={isOpen}
          onClose={() => setIsOpen(false)}
          takeWidthOfAnchor
        >
          <Paper mv='s' border='strong' shadow='far' css={{ minWidth: 200 }}>
            <Flex
              w='100%'
              gap='s'
              pv='s'
              direction='column'
              alignItems='flex-start'
              role='listbox'
            >
              <Box w='100%' ph='s'>
                <SegmentedControl
                  fullWidth
                  options={[
                    { key: 'Major', text: 'Major' },
                    { key: 'Minor', text: 'Minor' }
                  ]}
                  selected={scale}
                  onSelectOption={setScale}
                />
              </Box>
              <Divider css={{ width: '100%' }} />
              <Flex direction='column' w='100%' ph='s'>
                <FilterButtonOptions
                  options={keyOptions}
                  onChange={(option) =>
                    handleChange(
                      `${option.value} ${scale}`,
                      `${option.label} ${scale}`
                    )
                  }
                />
              </Flex>
            </Flex>
          </Paper>
        </Popup>
      )}
    </SelectInput>
  )
}
