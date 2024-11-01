import {
  ChangeEventHandler,
  FocusEventHandler,
  useCallback,
  useEffect,
  useState
} from 'react'

import { useFeatureFlag } from '@audius/common/hooks'
import { AccessConditions } from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  filterDecimalString,
  padDecimalValue,
  decimalIntegerToHumanReadable,
  Nullable
} from '@audius/common/utils'
import { Hint, IconInfo, Checkbox, Text, Box, Flex } from '@audius/harmony'
import { css } from '@emotion/react'
import cn from 'classnames'
import { useField } from 'formik'

import layoutStyles from 'components/layout/layout.module.css'
import { useMessages } from 'hooks/useMessages'

import { BoxedTextField } from '../../BoxedTextField'
import {
  DOWNLOAD_CONDITIONS,
  PREVIEW,
  PRICE,
  ALBUM_TRACK_PRICE,
  GateKeeper,
  LAST_GATE_KEEPER,
  IS_OWNED_BY_USER
} from '../../types'

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
    'Setting your track to Premium will remove the availability settings you set on your premium downloads. Don’t worry, your stems are still saved!',
  publishingRights: {
    checkboxLabel: 'Direct Publishing Payments',
    confirmationText:
      'In order to receive direct publishing payments from Audius, I hereby confirm:',
    bulletPoints: [
      'I own all publishing rights to this music, including performance rights',
      'I am not registered with a Performing Rights Organization or collection society'
    ]
  }
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
  const { isEnabled: isRightsAndCoversEnabled } = useFeatureFlag(
    FeatureFlags.RIGHTS_AND_COVERS
  )
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
            shouldShowRightsDeclaration={isRightsAndCoversEnabled}
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
            shouldShowRightsDeclaration={isRightsAndCoversEnabled}
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

  const [
    { value: isFullyOwnedByUser },
    _ignored1,
    { setValue: setIsFullyOwnedByUser }
  ] = useField<boolean>(IS_OWNED_BY_USER)

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

  const handleBoxClick = useCallback(() => {
    setIsFullyOwnedByUser(!isFullyOwnedByUser)
  }, [isFullyOwnedByUser, setIsFullyOwnedByUser])

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
      {shouldShowRightsDeclaration && (
        <Box onClick={handleBoxClick}>
          <Flex alignItems='center' justifyContent='flex-start' mb='s' gap='xs'>
            <Checkbox name={IS_OWNED_BY_USER} checked={!!isFullyOwnedByUser} />
            <Text variant='title'>
              {messages.publishingRights.checkboxLabel}
            </Text>
          </Flex>
          <Text variant='body'>
            {messages.publishingRights.confirmationText}
          </Text>
          <Box as='ul' ml='l' p='s' css={css({ listStyleType: 'disc' })}>
            {messages.publishingRights.bulletPoints.map((point, index) => (
              <Box as='li' key={index}>
                <Text variant='body'>{point}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </BoxedTextField>
  )
}
