import { ReactNode, useEffect, useState } from 'react'

type ClientOnlyProps = {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * A simple wrapper that only renders its children on the client.
 * This is used to disable certain parts of the app from rendering on the server.
 *
 * If you need to lazy load something on the client only, use vike-react/ClientOnly
 */
export const ClientOnly = (props: ClientOnlyProps) => {
  const { children, fallback = null } = props

  const [isClientSide, setIsClientSide] = useState(false)

  // useEffect only runs on the client
  useEffect(() => {
    setIsClientSide(true)
  }, [])

  return <>{isClientSide ? children : fallback}</>
}
