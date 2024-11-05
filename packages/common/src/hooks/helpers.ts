import { useSelector } from 'react-redux'

import { getHasAccount } from '~/store/account/selectors'
import { isRemoteConfigLoaded } from '~/store/remote-config/selectors'

export const useHasAccount = () => useSelector(getHasAccount)
export const useHasConfigLoaded = () => !!useSelector(isRemoteConfigLoaded)
