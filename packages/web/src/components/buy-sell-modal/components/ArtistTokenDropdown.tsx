import { useState } from 'react'

import { useArtistCoins } from '@audius/common/api'
import { DropdownInput, IconLogoCircleUSDCPng } from '@audius/harmony'

import { env } from 'services/env'

import { ArtistCoinIcon } from './ArtistCoinIcon'

export const ArtistTokenDropdown = ({
  includeUSDC = true,
  labelText,
  onSelect
}: {
  includeUSDC?: boolean
  labelText: string
  onSelect: (value: string) => void
}) => {
  const { data: allTokens } = useArtistCoins()
  const options =
    allTokens?.map((token) => ({
      label: token.ticker,
      value: token.mint,
      leadingElement: <ArtistCoinIcon mint={token.mint} size='l' hex />
    })) ?? []

  // USDC is an edge case - it isnt part of the artist coins list & has a different icon component & label text
  if (includeUSDC) {
    options.push({
      label: 'Cash (USDC)',
      value: env.USDC_MINT_ADDRESS,
      leadingElement: <IconLogoCircleUSDCPng size='l' hex />
    })
  }

  const [currentToken, setCurrentToken] = useState<string>(options[0].value)

  return (
    <DropdownInput
      options={options}
      placeholder='..'
      onSelect={(e) => onSelect(e?.currentTarget.value ?? '')}
      value={currentToken}
      hidePlaceholder
      onChange={(value) => setCurrentToken(value)}
      renderSelectedValue={(option) => (
        <ArtistCoinIcon mint={option?.value} size='2xl' hex />
      )}
      label={labelText}
    />
  )
}
