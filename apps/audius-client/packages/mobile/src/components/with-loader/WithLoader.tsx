import { ReactElement } from 'react'

import LoadingSpinner from '../loading-spinner'

type WithLoaderProps = {
  children: ReactElement | ReactElement[]
  loading: boolean
}

export const WithLoader = ({ children, loading }: WithLoaderProps) => {
  return (
    <>
      {loading ? (
        <LoadingSpinner style={{ alignSelf: 'center', marginVertical: 16 }} />
      ) : (
        children
      )}
    </>
  )
}
