import {
  ChangeEventHandler,
  FocusEventHandler,
  useCallback,
  useEffect,
  useState
} from 'react'

import { AccessConditions } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  decimalIntegerToHumanReadable,
  filterDecimalString,
  Nullable,
  padDecimalValue
} from '@audius/common/utils'
import { Hint, IconInfo } from '@audius/harmony'
import cn from 'classnames'
import { useField } from 'formik'

import layoutStyles from 'components/layout/layout.module.css'
import { useMessages } from 'hooks/useMessages'

import { BoxedTextField } from '../../BoxedTextField'
import {
  ALBUM_TRACK_PRICE,
  DOWNLOAD_CONDITIONS,
  GateKeeper,
  LAST_GATE_KEEPER,
  PREVIEW,
  PRICE
} from '../../types'

import { RightsDeclaration } from './RightsDeclaration'

const messagesV1 = {
  price: {
    // Standalone purchaseable track flow
    standaloneTrackPrice: {
      title: 'Set a Price',
      description:
        'Set the price fans must pay to unlock this track (minimum price of $1.00)',
      label: 'Cost to Unlock',
      placeholder: '1.00'
    },
    // Album purchase flow
    albumPrice: {
      title: 'Album Price',
      description:
        'Set the price fans must pay to unlock this album (minimum price of $1.00) ',
      label: 'Album Price',
      placeholder: '5.00'
    },
    // Applies to the individual tracks within album upload flow
    albumTrackPrice: {
      title: 'Track Price',
      description:
        'Set the price fans must pay to unlock a single track on your album (minimum price of $1.00)',
      label: 'Track Price',
      placeholder: '1.00'
    }
  },
  preview: {
    title: '30 Second Preview',
    description:
      'A 30 second preview will be generated. Specify a starting timestamp below.',
    placeholder: 'Start Time'
  },
  dollars: '$',
  usdc: '(USDC)',
  seconds: '(Seconds)',
  premiumDownloads:
    'Setting your track to Premium will remove the availability settings you set on your premium downloads. Don’t worry, your stems are still saved!'
}

const messagesV2 = {
  price: {
    standaloneTrackPrice: {
      description: 'The price to unlock this track (min $1)'
    },
    // Album purchase flow
    albumPrice: {
      title: 'Set Album Price',
      description: 'The price to unlock the entire album (min $1)'
    },
    albumTrackPrice: {
      title: 'Track Price',
      description:
        'The price for each track on the album when purchased individually. (min $1)'
    }
  },
  preview: {
    title: 'Track Preview',
    description: 'Specify when you want your 30 second track preview to start.'
  },
  seconds: 'Seconds'
}

export enum UsdcPurchaseType {
  TIP = 'tip',
  FOLLOW = 'follow'
}

export type TrackAvailabilityFieldsProps = {
  disabled?: boolean
  isAlbum?: boolean
  isUpload?: boolean
}

type PriceMessages = typeof messagesV1.price
export type PriceFieldProps = TrackAvailabilityFieldsProps & {
  messaging: PriceMessages[keyof PriceMessages]
  fieldName: typeof PRICE | typeof ALBUM_TRACK_PRICE
  prefillValue?: number
  shouldShowRightsDeclaration?: boolean
}

export const UsdcPurchaseFields = (props: TrackAvailabilityFieldsProps) => {
  const { disabled, isAlbum, isUpload } = props

  const [{ value: downloadConditions }] =
    useField<Nullable<AccessConditions>>(DOWNLOAD_CONDITIONS)
  const [{ value: lastGateKeeper }] = useField<GateKeeper>(LAST_GATE_KEEPER)
  const showPremiumDownloadsMessage =
    downloadConditions && lastGateKeeper.access === 'stemsAndDownloads'

  const messages = useMessages(
    messagesV1,
    messagesV2,
    FeatureFlags.HIDDEN_PAID_SCHEDULED
  )

  return (
    <div className={cn(layoutStyles.col, layoutStyles.gap4)}>
      {isAlbum ? (
        <>
          <PriceField
            disabled={disabled}
            messaging={messages.price.albumPrice}
            fieldName={PRICE}
            prefillValue={500}
            shouldShowRightsDeclaration
          />
          {isUpload && (
            <PriceField
              disabled={disabled}
              messaging={messages.price.albumTrackPrice}
              fieldName={ALBUM_TRACK_PRICE}
              prefillValue={100}
            />
          )}
          <input type='hidden' name={PREVIEW} value='0' />
        </>
      ) : (
        <>
          <PriceField
            disabled={disabled}
            messaging={messages.price.standaloneTrackPrice}
            fieldName={PRICE}
            prefillValue={100}
            shouldShowRightsDeclaration
          />
          <PreviewField disabled={disabled} />
          {showPremiumDownloadsMessage ? (
            <Hint icon={IconInfo}>{messages.premiumDownloads}</Hint>
          ) : null}
        </>
      )}
    </div>
  )
}

const PreviewField = (props: TrackAvailabilityFieldsProps) => {
  const { disabled } = props
  const [{ value }, _ignored, { setValue: setPreview }] =
    useField<number>(PREVIEW)
  const [humanizedValue, setHumanizedValue] = useState<string | undefined>(
    value?.toString()
  )

  const messages = useMessages(
    messagesV1,
    messagesV2,
    FeatureFlags.HIDDEN_PAID_SCHEDULED
  )

  const handlePreviewChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const input = e.target.value.replace(/[^0-9]+/g, '')
      setHumanizedValue(input)
      setPreview(Number(input))
    },
    [setPreview]
  )

  return (
    <BoxedTextField
      {...messages.preview}
      name={PREVIEW}
      label={messages.preview.placeholder}
      value={humanizedValue}
      placeholder={messages.preview.placeholder}
      endAdornmentText={messages.seconds}
      onChange={handlePreviewChange}
      disabled={disabled}
    />
  )
}

const PriceField = (props: PriceFieldProps) => {
  const {
    disabled,
    messaging,
    fieldName,
    prefillValue,
    shouldShowRightsDeclaration
  } = props
  const [{ value }, _ignored, { setValue: setPrice }] = useField<number | null>(
    fieldName
  )

  const messages = useMessages(
    messagesV1,
    messagesV2,
    FeatureFlags.HIDDEN_PAID_SCHEDULED
  )

  const [humanizedValue, setHumanizedValue] = useState<string | null>(
    value
      ? decimalIntegerToHumanReadable(value)
      : // Use prefilled value if set
      prefillValue !== undefined
      ? decimalIntegerToHumanReadable(prefillValue)
      : null
  )

  // This logic is a bit of a hack to set an initial value once in the Formik field (when a prefilled value is desired)
  // This could have lived elsewhere (i.e. initialValues or onChange higher up),
  // but it made sense to colocate here since we also had to set up workaround logic to work with the "setHumanizedValue" state
  const [hasSetInitialValue, setHasSetInitialValue] = useState(false)
  useEffect(() => {
    if (
      prefillValue != null &&
      !hasSetInitialValue &&
      (value === null || value === undefined)
    ) {
      setPrice(prefillValue)
      setHasSetInitialValue(true)
    }
  }, [hasSetInitialValue, prefillValue, setPrice, value])

  const handlePriceChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const { human, value } = filterDecimalString(e.target.value)
      if (value === 0) {
        setHumanizedValue(null)
        setPrice(null)
      } else {
        setHumanizedValue(human)
        setPrice(value)
      }
    },
    [setPrice]
  )

  const handlePriceBlur: FocusEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      if (humanizedValue === null && !e.target.value) {
        // Do nothing if there is no value set and the user just loses focus

        return
      }
      setHumanizedValue(padDecimalValue(e.target.value))
    },
    [humanizedValue]
  )

  return (
    <BoxedTextField
      {...messaging}
      name={fieldName}
      label={messaging.label}
      value={humanizedValue ?? undefined}
      placeholder={messaging.placeholder}
      startAdornmentText={messages.dollars}
      endAdornmentText={messages.usdc}
      onChange={handlePriceChange}
      onBlur={handlePriceBlur}
      disabled={disabled}
    >
      {shouldShowRightsDeclaration ? <RightsDeclaration /> : null}
    </BoxedTextField>
  )
}
