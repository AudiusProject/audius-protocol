import { ReactNode } from 'react'

import { ClientOnly } from 'components/client-only/ClientOnly'

import { Root } from '../Root'

export const SsrRoot = ({ children }: { children: ReactNode }) => {
  return (
    <ClientOnly fallback={children}>
      <Root />
    </ClientOnly>
  )
}
