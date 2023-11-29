import { useSelector } from 'react-redux'

import { getAccountUser } from 'store/account/selectors'
import { isRemoteConfigLoaded } from 'store/remote-config/selectors'

export const useHasAccount = () => !!useSelector(getAccountUser)
export const useHasConfigLoaded = () => !!useSelector(isRemoteConfigLoaded)
