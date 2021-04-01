import { useSelector } from 'react-redux'
import { getLocation } from '../store/lifecycle/selectors'

const useLocation = () => {
  return useSelector(getLocation)
}

export default useLocation
