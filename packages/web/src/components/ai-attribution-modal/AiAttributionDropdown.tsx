import { useCallback, useState } from 'react'

import { imageProfilePicEmpty } from '@audius/common/assets'
import { SquareSizes, Kind } from '@audius/common/models'
import { getTierForUser } from '@audius/common/store'
import { SelectProps } from 'antd'
import { useDispatch } from 'react-redux'
import { createSelector } from 'reselect'

import { fetchSearch } from 'common/store/search-ai-bar/actions'
import { getSearchResults } from 'common/store/search-ai-bar/selectors'
import { useSelector } from 'utils/reducer'

import DropdownInput from './DropdownInput'
import SearchBarResult from './SearchBarResult'

const selectSearchResults = createSelector(getSearchResults, (results) => {
  const items = results
    .map((user) => ({
      text: user.name,
      value: user.user_id,
      disabled: !user.allow_ai_attribution,
      el: (
        <SearchBarResult
          // @ts-ignore
          kind={Kind.USERS}
          id={user.user_id}
          userId={user.user_id}
          artwork={user.profile_picture}
          size={SquareSizes.SIZE_150_BY_150}
          primary={user.name || user.handle}
          defaultImage={imageProfilePicEmpty}
          isVerifiedUser={user.is_verified}
          // @ts-ignore
          tier={getTierForUser(user)}
          allowAiAttribution={user.allow_ai_attribution}
          name={user.name}
          handle={user.handle}
        />
      )
    }))
    .filter((item) => item.text)
  return { items }
})

type AiAttributionDropdownProps = SelectProps & {
  error?: string | false
  helperText?: string | false
}

export const AiAttributionDropdown = (props: AiAttributionDropdownProps) => {
  const dispatch = useDispatch()
  const users = useSelector(selectSearchResults)
  const [searchInput, setSearchInput] = useState('')

  const handleSearch = useCallback(
    (searchInput: string) => {
      dispatch(fetchSearch(searchInput))
      setSearchInput(searchInput)
    },
    [dispatch]
  )

  return (
    <DropdownInput
      id='ai-attribution'
      menu={users}
      label='Find Users'
      size='large'
      input={searchInput}
      onSearch={handleSearch}
      layout='vertical'
      {...props}
    />
  )
}
