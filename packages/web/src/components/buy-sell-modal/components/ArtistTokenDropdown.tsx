import { useArtistCoins } from '@audius/common/api'

import DropdownInput from 'components/data-entry/DropdownInput'

export const ArtistTokenDropdown = () => {
  const { data: allTokens } = useArtistCoins()
  console.log({ allTokens })
  return (
    <DropdownInput menu={{ items: [] }} placeholder='..' onSelect={() => {}} />
  )
}
