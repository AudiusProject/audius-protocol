import { useSelector } from 'react-redux'

import { isRemoteConfigLoaded } from '~/store/remote-config/selectors'

export const useHasConfigLoaded = () => !!useSelector(isRemoteConfigLoaded)
