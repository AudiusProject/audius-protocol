import { useCallback } from 'react'

import { useArtistCoins, useCurrentUserId } from '@audius/common/api'
import { useAccessAndRemixSettings, useHasNoTokens } from '@audius/common/hooks'
import { StreamTrackAvailabilityType } from '@audius/common/models'
import { useField } from 'formik'
import { IconArtistCoin } from '~harmony/icons'

import { TokenIcon } from 'components/buy-sell-modal/TokenIcon'
import { ModalRadioItem } from 'components/modal-radio/ModalRadioItem'

import { AccessAndSaleFormValues, STREAM_CONDITIONS } from '../../types'

import { TokenGatedDescription } from './TokenGatedDescription'

const messages = {
  tokenGated: 'Coin Gated',
  noCoins: 'No coins found. Launch a coin to enable this option.',
  fromFreeHint: (contentType: 'album' | 'track') =>
    `You can't make a free ${contentType} premium.`
}
type TokenGatedRadioFieldProps = {
  isRemix: boolean
  isUpload?: boolean
  isAlbum?: boolean
  isInitiallyUnlisted?: boolean
}

export const TokenGatedRadioField = (props: TokenGatedRadioFieldProps) => {
  const { isRemix, isUpload, isInitiallyUnlisted, isAlbum } = props
  const { data: userId } = useCurrentUserId()
  const { data: coins } = useArtistCoins({
    owner_id: userId ? [userId] : undefined
  })

  const [, , { setValue: setStreamConditionsValue }] =
    useField<AccessAndSaleFormValues[typeof STREAM_CONDITIONS]>(
      STREAM_CONDITIONS
    )

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (coins?.length && e.target.checked) {
        setStreamConditionsValue({
          token_gate: {
            token_mint: coins[0].mint,
            token_amount: 1
          }
        })
      }
    },
    [coins, setStreamConditionsValue]
  )

  const hasNoTokens = useHasNoTokens()
  const { disableTokenGate: disabled } = useAccessAndRemixSettings({
    isUpload: !!isUpload,
    isRemix,
    isInitiallyUnlisted: !!isInitiallyUnlisted
  })

  return (
    <ModalRadioItem
      icon={
        coins?.[0]?.logoUri ? (
          <TokenIcon logoURI={coins?.[0]?.logoUri} hex h={24} w={24} />
        ) : (
          <IconArtistCoin />
        )
      }
      label={messages.tokenGated}
      value={StreamTrackAvailabilityType.TOKEN_GATED}
      disabled={disabled}
      onChange={handleSelect}
      description={
        <TokenGatedDescription
          tokenName={coins?.[0]?.ticker ?? coins?.[0]?.mint ?? ''}
          hasTokens={!hasNoTokens}
          isUpload={true}
        />
      }
      tooltipText={
        hasNoTokens
          ? messages.noCoins
          : disabled
            ? messages.fromFreeHint(isAlbum ? 'album' : 'track')
            : undefined
      }
    />
  )
}
