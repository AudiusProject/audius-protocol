import { useEffect, useMemo, useState } from 'react'

import {
  Button,
  Divider,
  FilterButton,
  FilterButtonOptions,
  Flex,
  IconCaretDown,
  Paper,
  Popup,
  SegmentedControl,
  TextInput,
  useTheme
} from '@audius/harmony'
import { css } from '@emotion/css'
import { useSearchParams } from 'react-router-dom-v5-compat'

import { useUpdateSearchParams } from './utils'

type BpmTargetType = 'exact' | 'range5' | 'range10'
const targetOptions: { label: string; value: BpmTargetType }[] = [
  {
    label: 'Exact',
    value: 'exact'
  },
  {
    label: '± 5',
    value: 'range5'
  },
  {
    label: '± 10',
    value: 'range10'
  }
]
const bpmOptions = [
  {
    label: 'Very Slow',
    value: '1-60',
    helperText: '<60 BPM'
  },
  {
    label: 'Slow',
    value: '60-90',
    helperText: '60-90 BPM'
  },
  {
    label: 'Medium',
    value: '90-110',
    helperText: '90-110 BPM'
  },
  {
    label: 'Upbeat',
    value: '110-140',
    helperText: '110-140 BPM'
  },
  {
    label: 'Fast',
    value: '140-160',
    helperText: '140-160 BPM'
  },
  {
    label: 'Very Fast',
    value: '160-999',
    helperText: '160+ BPM'
  }
]

const messages = {
  bpm: 'BPM',
  minBpm: 'Min',
  maxBpm: 'Max'
}

type ViewProps = {
  handleChange: (value: string, label: string) => void
}

const BpmRangeView = ({ handleChange }: ViewProps) => {
  const [minBpm, setMinBpm] = useState('')
  const [maxBpm, setMaxBpm] = useState('')
  // NOTE: Memo to avoid the constantly changing function instance from triggering the effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onChange = useMemo(() => handleChange, [])

  useEffect(() => {
    let value = ''

    if (minBpm || maxBpm) {
      value = `${minBpm || '1'}-${maxBpm || '999'}`
    }

    onChange(value, `${value} ${messages.bpm}`)
  }, [maxBpm, minBpm, onChange])

  return (
    <>
      <Flex direction='column' w='100%' ph='s'>
        <FilterButtonOptions
          options={bpmOptions}
          onChange={(option) => {
            handleChange(option.value, option.helperText ?? option.value)
          }}
        />
      </Flex>
      <Flex
        ph='s'
        gap='xs'
        w={240}
        alignItems='center'
        // NOTE: Adds a little flexibility so the user doesn't close the popup by accident
        onClick={(e) => e.stopPropagation()}
      >
        <TextInput
          label={messages.minBpm}
          placeholder={messages.minBpm}
          hideLabel
          onChange={(e) => setMinBpm(e.target.value)}
          inputRootClassName={css({ height: '48px !important' })}
        />
        -
        <TextInput
          label={messages.maxBpm}
          placeholder={messages.maxBpm}
          hideLabel
          onChange={(e) => setMaxBpm(e.target.value)}
          inputRootClassName={css({ height: '48px !important' })}
        />
      </Flex>
    </>
  )
}

const BpmTargetView = ({ handleChange }: ViewProps) => {
  const { color } = useTheme()
  const [bpmTarget, setBpmTarget] = useState('')
  const [bpmTargetType, setBpmTargetType] = useState<BpmTargetType>('exact')
  // NOTE: Memo to avoid the constantly changing function instance from triggering the effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onChange = useMemo(() => handleChange, [])

  useEffect(() => {
    let value = ''

    if (bpmTarget) {
      if (bpmTargetType === 'exact') {
        value = bpmTarget
      } else {
        const mod = bpmTargetType === 'range5' ? 5 : 10
        value = `${Math.max(Number(bpmTarget) - mod, 1)}-${Math.min(
          Number(bpmTarget) + mod,
          999
        )}`
      }
    }

    onChange(value, `${value} ${messages.bpm}`)
  }, [bpmTarget, bpmTargetType, onChange])

  return (
    <Flex
      direction='column'
      ph='s'
      gap='s'
      // NOTE: Adds a little flexibility so the user doesn't close the popup by accident
      onClick={(e) => e.stopPropagation()}
    >
      <TextInput
        label={messages.bpm}
        placeholder={messages.bpm}
        hideLabel
        onChange={(e) => setBpmTarget(e.target.value)}
        inputRootClassName={css({ height: '48px !important' })}
      />
      <Flex justifyContent='center' alignItems='center' gap='xs'>
        {targetOptions.map((option) => (
          <Button
            key={`targetOption_${option.value}`}
            size='small'
            variant={bpmTargetType === option.value ? 'primary' : 'tertiary'}
            // @ts-ignore
            hexColor={
              bpmTargetType === option.value
                ? color.secondary.secondary
                : undefined
            }
            fullWidth
            onClick={() => setBpmTargetType(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </Flex>
    </Flex>
  )
}

export const BpmFilter = () => {
  const [urlSearchParams] = useSearchParams()
  const bpm = urlSearchParams.get('bpm')
  const updateSearchParams = useUpdateSearchParams('bpm')
  const [bpmFilterType, setBpmFilterType] = useState<'range' | 'target'>(
    'range'
  )

  const label = bpm ? `${bpm} ${messages.bpm}` : `${messages.bpm}`
  const InputView = bpmFilterType === 'range' ? BpmRangeView : BpmTargetView

  return (
    <FilterButton
      value={bpm}
      label={label}
      onChange={updateSearchParams}
      iconRight={IconCaretDown}
    >
      {({ handleChange, isOpen, setIsOpen, anchorRef }) => (
        <Popup
          anchorRef={anchorRef}
          isVisible={isOpen}
          onClose={() => setIsOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <Paper w={242} mt='s' border='strong' shadow='far'>
            <Flex
              w='100%'
              pv='s'
              gap='s'
              direction='column'
              alignItems='flex-start'
              role='listbox'
            >
              <Flex
                direction='column'
                w='100%'
                ph='s'
                // NOTE: Adds a little flexibility so the user doesn't close the popup by accident
                onClick={(e) => e.stopPropagation()}
              >
                <SegmentedControl
                  options={[
                    { key: 'range', text: 'Range' },
                    { key: 'target', text: 'Target' }
                  ]}
                  selected={bpmFilterType}
                  onSelectOption={setBpmFilterType}
                />
              </Flex>
              <Divider css={{ width: '100%' }} />
              <InputView handleChange={handleChange} />
            </Flex>
          </Paper>
        </Popup>
      )}
    </FilterButton>
  )
}
