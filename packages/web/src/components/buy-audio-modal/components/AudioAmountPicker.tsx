import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react'

import { IconLogoCircle } from '@audius/harmony'
import {
  RadioPillButton,
  RadioButtonGroup,
  TokenAmountInput,
  TokenAmountInputChangeHandler
} from '@audius/stems'
import { debounce, uniqueId } from 'lodash'

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

  const id = useMemo(() => uniqueId(), [])

  return (
    <>
      {!isCustomAmountInputVisible ? (
        <AmountPreview amount={presetAmount} />
      ) : null}
      <RadioButtonGroup
        aria-labelledby={`audioAmountPicker-label-${id}`}
        className={styles.presetAmountButtons}
        name='AmountPicker'
        value={value}
        onChange={handleChange}
      >
        <div id={`audioAmountPicker-label-${id}`} className={styles.label}>
          {messages.amountOfAudio}
        </div>
        {presetAmounts.map((amount) => (
          <RadioPillButton
            key={amount}
            name={'amount'}
            className={styles.presetAmountButton}
            label={amount}
            aria-label={`${amount} audio`}
            value={amount}
          />
        ))}
        {hideCustomAmount ? null : (
          <RadioPillButton
            className={styles.customAmountButton}
            name={'amount'}
            label={
              <span className={styles.customAmountButtonText}>
                Custom Amount
              </span>
            }
            value={'custom'}
          />
        )}
      </RadioButtonGroup>
      {isCustomAmountInputVisible ? (
        <TokenAmountInput
          inputRef={customAmountRef}
          aria-label={messages.customAmount}
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
