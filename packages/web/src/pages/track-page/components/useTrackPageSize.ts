import { useMedia } from 'react-use'

export const useTrackPageSize = () => {
  return useMedia('(min-width: 1054px)')
}
