import {
  ChangeEventHandler,
  FocusEventHandler,
  useCallback,
  useState
} from 'react'

import { AccessConditions } from '@audius/common/models'
import {
  filterDecimalString,
  padDecimalValue,
  decimalIntegerToHumanReadable,
  Nullable
} from '@audius/common/utils'
import { IconInfo } from '@audius/harmony'
import cn from 'classnames'
import { useField } from 'formik'

import { HelpCallout } from 'components/help-callout/HelpCallout'
import layoutStyles from 'components/layout/layout.module.css'

import { BoxedTextField } from '../../BoxedTextField'
import {
  DOWNLOAD_CONDITIONS,
  PREVIEW,
  PRICE,
  ALBUM_TRACK_PRICE
} from '../../types'

const messages = {
  price: {
    // Standalone purchaseable track flow
    standaloneTrackPrice: {
      title: 'Set a Price',
      description:
        'Set the price fans must pay to unlock this track (minimum price of $1.00)',
      label: 'Cost to Unlock',
      placeholder: '1.00'
    },
    // Applies to the individual tracks within album upload flow
    albumTrackPrice: {
      title: 'Track Price',
      description:
        'Set the price fans must pay to unlock a single track on your album (minimum price of $1.00)',
      label: 'Track price',
      placeholder: '1.00'
    },
    // Album purchase flow
    albumPrice: {
      title: 'Album Price',
      description:
        'Set the price fans must pay to unlock this album (minimum price of $1.00) ',
      label: 'Album price',
      placeholder: '5.00'
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

export enum UsdcPurchaseType {
  TIP = 'tip',
  FOLLOW = 'follow'
}

export type TrackAvailabilityFieldsProps = {
  disabled?: boolean
  isAlbum?: boolean
  isUpload?: boolean
}

type PriceMessages = typeof messages.price
export type PriceFieldProps = TrackAvailabilityFieldsProps & {
  messaging: PriceMessages[keyof PriceMessages]
  fieldName: typeof PRICE | typeof ALBUM_TRACK_PRICE
}

export const UsdcPurchaseFields = (props: TrackAvailabilityFieldsProps) => {
  const { disabled, isAlbum, isUpload } = props
  const [{ value: downloadConditions }] =
    useField<Nullable<AccessConditions>>(DOWNLOAD_CONDITIONS)

  return (
    <div className={cn(layoutStyles.col, layoutStyles.gap4)}>
      {isAlbum ? (
        <>
          <PriceField
            disabled={disabled}
            messaging={messages.price.albumPrice}
            fieldName={PRICE}
          />
          {isUpload && (
            <PriceField
              disabled={disabled}
              messaging={messages.price.albumTrackPrice}
              fieldName={ALBUM_TRACK_PRICE}
            />
          )}
          <input type='hidden' name={PREVIEW} value='0' />
          {downloadConditions && !isAlbum ? (
            <HelpCallout
              icon={<IconInfo />}
              content={messages.premiumDownloads}
            />
          ) : null}
        </>
      ) : (
        <>
          <PriceField
            disabled={disabled}
            messaging={messages.price.standaloneTrackPrice}
            fieldName={PRICE}
          />
          <PreviewField disabled={disabled} />
          {downloadConditions ? (
            <HelpCallout
              icon={<IconInfo />}
              content={messages.premiumDownloads}
            />
          ) : null}
        </>
      )}
    </div>
  )
}

const PreviewField = (props: TrackAvailabilityFieldsProps) => {
  const { disabled } = props
  const [{ value }, , { setValue: setPreview }] = useField<number>(PREVIEW)
  const [humanizedValue, setHumanizedValue] = useState<string | undefined>(
    value?.toString()
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
      endAdornment={messages.seconds}
      onChange={handlePreviewChange}
      disabled={disabled}
    />
  )
}

const PriceField = (props: PriceFieldProps) => {
  const { disabled, messaging, fieldName } = props
  const [{ value }, , { setValue: setPrice }] = useField<number | null>(
    fieldName
  )
  const [humanizedValue, setHumanizedValue] = useState(
    value ? decimalIntegerToHumanReadable(value) : null
  )

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
    [setPrice, setHumanizedValue]
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
    />
  )
}
