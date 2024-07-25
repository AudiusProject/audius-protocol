import { useCallback } from 'react'

import { Flex, OptionsFilterButton } from '@audius/harmony'
import { useAsync } from 'react-use'

const TOKEN_LIST_URL = 'https://token.jup.ag/strict'

type Asset = {
  address: string
  name: string
  logoURI: string
  symbol: string
}

export const TokenPicker = ({
  selectedTokenAddress,
  onChange
}: {
  selectedTokenAddress: string
  onChange: (address: string) => void
}) => {
  const assets = useAsync(async () => {
    const res = await fetch(TOKEN_LIST_URL)
    const json = await res.json()
    return json as Asset[]
  }, [])

  const handleChange = useCallback(
    (address: string) => {
      onChange(address)
    },
    [onChange]
  )

  if (assets.loading || assets.error) {
    return null
  }

  const options = (assets.value ?? []).slice(0, 10).map((asset) => ({
    label: asset.symbol,
    value: asset.address,
    helperText:
      asset.name.length > 15 ? asset.name.slice(0, 12) + '...' : asset.name,
    leadingElement: (
      <Flex borderRadius='s' style={{ overflow: 'hidden' }}>
        <img height={20} width={20} src={asset.logoURI} loading='lazy' />
      </Flex>
    ),
    labelLeadingElement: (
      <Flex borderRadius='s' style={{ overflow: 'hidden' }}>
        <img height={20} width={20} src={asset.logoURI} />
      </Flex>
    )
  }))

  return (
    <OptionsFilterButton
      label='asset'
      popupAnchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      popupMaxHeight={400}
      popupTransformOrigin={{ vertical: 'top', horizontal: 'left' }}
      options={options}
      selection={selectedTokenAddress}
      onChange={handleChange}
      showFilterInput
      variant='replaceLabel'
    />
  )
}
