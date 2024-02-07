import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import {
  IconLogoCircle,
  TokenAmountInput,
  TokenAmountInputChangeHandler,
  RadioGroup,
  SelectablePill
} from '@audius/harmony'
import { debounce } from 'lodash'

import styles from './AudioAmountPicker.module.css'

const messages = {
  selectAnAmount: 'Select an amount',
  buy: 'Buy',
  amountOfAudio: 'Amount of $AUDIO',
  customAmount: 'Custom Amount',
  placeholder: 'Enter an amount',
  tokenLabel: '$AUDIO'
}

const INPUT_DEBOUNCE_MS = 200

const IconAUDIO = () => {
  return <IconLogoCircle aria-label='AUDIO Token Icon' size='2xl' />
}

const AmountPreview = ({ amount }: { amount?: string }) => {
  return (
    <div className={styles.amountPreviewContainer}>
      {amount && amount !== '0' ? (
        <>
          <div className={styles.amountPreviewBuy}>{messages.buy}</div>
          <div className={styles.amountPreview}>
            <IconAUDIO />
            {amount} $AUDIO
          </div>
        </>
      ) : (
        messages.selectAnAmount
      )}
    </div>
  )
}

export const AudioAmountPicker = ({
  presetAmounts,
  hideCustomAmount,
  onAmountChanged
}: {
  presetAmounts: string[]
  hideCustomAmount?: boolean
  onAmountChanged: (amount: string) => void
}) => {
  const [isCustomAmountInputVisible, setIsCustomAmountInputVisible] =
    useState(false)
  const [value, setValue] = useState<string | null>(null)
  const [presetAmount, setPresetAmount] = useState<string>()
  const [customAmount, setCustomAmount] = useState<string>('')

  const customAmountRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setValue(value)
      if (value === 'custom') {
        setIsCustomAmountInputVisible(true)
        if (customAmount) {
          onAmountChanged(customAmount)
        }
      } else {
        setIsCustomAmountInputVisible(false)
        setPresetAmount(value)
        onAmountChanged(value)
      }
    },
    [customAmount, onAmountChanged]
  )

  const debouncedOnAmountChange = useMemo(
    () => debounce(onAmountChanged, INPUT_DEBOUNCE_MS),
    [onAmountChanged]
  )

  useEffect(() => {
    debouncedOnAmountChange.cancel()
  }, [debouncedOnAmountChange])

  const handleCustomAmountChange = useCallback<TokenAmountInputChangeHandler>(
    (amount) => {
      setCustomAmount(amount)
      debouncedOnAmountChange(amount)
    },
    [setCustomAmount, debouncedOnAmountChange]
  )

  useEffect(() => {
    if (isCustomAmountInputVisible) {
      customAmountRef.current?.focus()
    }
  }, [isCustomAmountInputVisible, customAmountRef])

  return (
    <>
      {!isCustomAmountInputVisible ? (
        <AmountPreview amount={presetAmount} />
      ) : null}
      <RadioGroup
        direction='row'
        wrap='wrap'
        gap='s'
        aria-labelledby={'audioAmountPicker-label'}
        name='amount'
        value={value}
        onChange={handleChange}
      >
        <div id={'audioAmountPicker-label'} className={styles.label}>
          {messages.amountOfAudio}
        </div>
        {presetAmounts.map((amount) => (
          <SelectablePill
            key={amount}
            size='oversized'
            type='radio'
            css={{ flex: '1 30%' }}
            label={amount}
            aria-label={`${amount} audio`}
            value={amount}
          />
        ))}
        {hideCustomAmount ? null : (
          <SelectablePill
            size='oversized'
            css={{ flexBasis: '100%' }}
            type='radio'
            value='custom'
            label={messages.customAmount}
          />
        )}
      </RadioGroup>
      {isCustomAmountInputVisible ? (
        <TokenAmountInput
          ref={customAmountRef}
          label={messages.customAmount}
          placeholder={messages.placeholder}
          tokenLabel={messages.tokenLabel}
          value={customAmount}
          isWhole
          onChange={handleCustomAmountChange}
        />
      ) : null}
    </>
  )
}
