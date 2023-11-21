import { ReactNode, Suspense, useEffect, useState } from 'react'

type ClientOnlyProps = {
  children: ReactNode
  fallback?: ReactNode
}

export const ClientOnly = (props: ClientOnlyProps) => {
  const { children, fallback } = props

  const [clientChildren, setClientChildren] = useState(fallback)

  useEffect(() => {
    setClientChildren(children)
  }, [])

  return <Suspense fallback={fallback}>{clientChildren}</Suspense>
}
