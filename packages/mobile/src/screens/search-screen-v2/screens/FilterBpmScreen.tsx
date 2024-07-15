import { useCallback, useEffect, useMemo, useState } from 'react'

import { Button, Flex, Text, TextInput, useTheme } from '@audius/harmony-native'
import { KeyboardAvoidingView, SegmentedControl } from 'app/components/core'
import { FormScreen } from 'app/screens/form-screen'
import { SelectionItemList } from 'app/screens/list-selection-screen/SelectionItemList'

import { useSearchFilter } from '../searchState'

const MIN_BPM = 1
const MAX_BPM = 999

const messages = {
  title: 'Bpm',
  bpm: 'BPM',
  range: 'Range',
  target: 'Target',
  minBpm: 'Min',
  maxBpm: 'Max',
  tooLowError: `BPM less than ${MIN_BPM}`,
  tooHighError: `BPM greater than ${MAX_BPM}`,
  invalidMinMaxError: 'Min greater than max'
}

type ViewProps = {
  value: string | undefined
  setValue: (value: string) => void
}

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

const rangeOptions = [
  {
    label: 'Very Slow (<60 BPM)',
    value: `${MIN_BPM}-60`
  },
  {
    label: 'Slow (60-90 BPM)',
    value: '60-90'
  },
  {
    label: 'Medium (90-110 BPM)',
    value: '90-110'
  },
  {
    label: 'Upbeat (110-140 BPM)',
    value: '110-140'
  },
  {
    label: 'Fast (140-160 BPM)',
    value: '140-160'
  },
  {
    label: 'Very Fast (160+ BPM)',
    value: `160-${MAX_BPM}`
  },
  {
    label: 'Custom',
    value: 'custom'
  }
]

const BpmRangeView = ({ value, setValue }: ViewProps) => {
  const [bpmRange, setBpmRange] = useState<string>()
  const [minBpm, setMinBpm] = useState('')
  const [maxBpm, setMaxBpm] = useState('')
  const [minError, setMinError] = useState<string | null>(null)
  const [maxError, setMaxError] = useState<string | null>(null)
  // NOTE: Memo to avoid the constantly changing function instance from triggering the effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onChange = useMemo(() => setValue, [])

  useEffect(() => {
    if (bpmRange === 'custom') {
      setValue('')
    } else if (bpmRange) {
      onChange(bpmRange)
    }
  }, [bpmRange, onChange, setValue])

  useEffect(() => {
    if (!value && (bpmRange || minBpm || maxBpm)) {
      if (bpmRange !== 'custom') setBpmRange('')
      setMinBpm('')
      setMaxBpm('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, setBpmRange, setMinBpm, setMaxBpm])

  useEffect(() => {
    // Validation
    const minVal = Number(minBpm)
    const maxVal = Number(maxBpm)
    let hasError = false

    if (minBpm) {
      if (minVal < MIN_BPM) {
        setMinError(messages.tooLowError)
        hasError = true
      } else if (minVal > MAX_BPM) {
        setMinError(messages.tooHighError)
        hasError = true
      } else if (maxBpm && minVal > maxVal) {
        setMinError(messages.invalidMinMaxError)
        hasError = true
      } else if (minError) {
        setMinError(null)
      }
    } else if (minError) {
      setMinError(null)
    }

    if (maxBpm) {
      if (maxVal < MIN_BPM) {
        setMaxError(messages.tooLowError)
        hasError = true
      } else if (maxVal > MAX_BPM) {
        setMaxError(messages.tooHighError)
        hasError = true
      } else if (maxError) {
        setMaxError(null)
      }
    } else if (maxError) {
      setMaxError(null)
    }

    if (hasError) return

    // Value Update
    let value = ''

    if (minBpm || maxBpm) {
      value = `${Number(minBpm || MIN_BPM)}-${Number(maxBpm || MAX_BPM)}`
    }

    onChange(value)
  }, [maxBpm, minBpm, minError, maxError, onChange])

  return (
    <>
      <Flex>
        <SelectionItemList
          data={rangeOptions}
          value={bpmRange}
          onChange={setBpmRange}
        />
      </Flex>
      <Flex
        flex={1}
        direction='row'
        p='l'
        gap='xs'
        w='100%'
        alignItems='flex-start'
      >
        {bpmRange === 'custom' ? (
          <>
            <TextInput
              style={{ flex: 1, alignSelf: 'flex-start' }}
              value={minBpm}
              label={messages.minBpm}
              keyboardType='numeric'
              error={!!minError}
              helperText={minError}
              aria-errormessage={minError ?? undefined}
              placeholder={messages.minBpm}
              onChangeText={(text) => {
                const validated = text.match(/^(\d{0,3}$)/)
                if (validated) setMinBpm(text)
              }}
            />
            <Text style={{ alignSelf: 'flex-start', paddingVertical: 20 }}>
              -
            </Text>
            <TextInput
              style={{ flex: 1, alignSelf: 'flex-start' }}
              value={maxBpm}
              label={messages.maxBpm}
              keyboardType='numeric'
              error={!!maxError}
              helperText={maxError}
              aria-errormessage={maxError ?? undefined}
              placeholder={messages.maxBpm}
              onChangeText={(text) => {
                const validated = text.match(/^(\d{0,3}$)/)
                if (validated) setMaxBpm(text)
              }}
            />
          </>
        ) : null}
      </Flex>
    </>
  )
}

const BpmTargetView = ({ value, setValue }: ViewProps) => {
  const { color } = useTheme()
  const [bpmTarget, setBpmTarget] = useState('')
  const [bpmTargetType, setBpmTargetType] = useState<BpmTargetType>('exact')
  const [error, setError] = useState<string | null>(null)
  // NOTE: Memo to avoid the constantly changing function instance from triggering the effect
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onChange = useMemo(() => setValue, [])

  useEffect(() => {
    if (!value && bpmTarget) {
      setBpmTarget('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    // Validation
    const val = Number(bpmTarget)
    let hasError = false

    if (bpmTarget) {
      if (val < MIN_BPM) {
        setError(messages.tooLowError)
        hasError = true
      } else if (val > MAX_BPM) {
        setError(messages.tooHighError)
        hasError = true
      } else if (error) {
        setError(null)
      }
    } else if (error) {
      setError(null)
    }

    if (hasError) return

    // Value Update
    let value = ''

    if (bpmTarget) {
      if (bpmTargetType === 'exact') {
        // Strip leading 0's
        value = Number(bpmTarget).toString()
      } else {
        const mod = bpmTargetType === 'range5' ? 5 : 10
        value = `${Math.max(Number(bpmTarget) - mod, MIN_BPM)}-${Math.min(
          Number(bpmTarget) + mod,
          MAX_BPM
        )}`
      }
    }

    onChange(value)
  }, [bpmTarget, bpmTargetType, error, onChange])

  return (
    <Flex flex={1} ph='l' gap='l'>
      <TextInput
        label={messages.bpm}
        keyboardType='numeric'
        error={!!error}
        helperText={error}
        aria-errormessage={error ?? undefined}
        placeholder={messages.bpm}
        value={bpmTarget}
        onChangeText={(text) => {
          const validated = text.match(/^(\d{0,3}$)/)
          if (validated) setBpmTarget(text)
        }}
      />
      <Flex direction='row' gap='s'>
        {targetOptions.map((option) => (
          <Button
            key={`targetOption_${option.value}`}
            size='small'
            style={{ flex: 1 }}
            onPress={() => setBpmTargetType(option.value)}
            // @ts-ignore
            hexColor={color.secondary.secondary}
            variant={bpmTargetType === option.value ? 'primary' : 'tertiary'}
          >
            {option.label}
          </Button>
        ))}
      </Flex>
    </Flex>
  )
}

export const FilterBpmScreen = () => {
  const [, setBpm, clearBpm] = useSearchFilter('bpm')
  const [bpmValue, setBpmValue] = useState<string>()
  const [bpmType, setBpmType] = useState('range')

  const handleSubmit = useCallback(() => {
    if (bpmValue) {
      setBpm(bpmValue)
    } else {
      clearBpm()
    }
  }, [bpmValue, clearBpm, setBpm])

  const handleClear = useCallback(() => {
    setBpmValue('')
  }, [setBpmValue])

  const InputView = bpmType === 'range' ? BpmRangeView : BpmTargetView

  return (
    <FormScreen
      title={messages.title}
      onSubmit={handleSubmit}
      onClear={handleClear}
      variant='white'
      clearable={Boolean(bpmValue)}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        keyboardShowingOffset={bpmType === 'range' ? 160 : 337}
      >
        <Flex p='l'>
          <SegmentedControl
            options={[
              { key: 'range', text: messages.range },
              { key: 'target', text: messages.target }
            ]}
            selected={bpmType}
            onSelectOption={setBpmType}
            fullWidth
            equalWidth
          />
        </Flex>
        <InputView value={bpmValue} setValue={setBpmValue} />
      </KeyboardAvoidingView>
    </FormScreen>
  )
}
