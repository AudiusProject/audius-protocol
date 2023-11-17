import { PropsWithChildren } from 'react'

import { TikTokProfile } from '@audius/common'

import { TikTokAuth } from './TikTokAuthButton'

type TikTokAuthLinkProps = PropsWithChildren<{
  onFailure: (e: Error) => void
  onSuccess: (uuid: string, profile: TikTokProfile) => void
  onStart?: () => void
  className?: string
}>

export const TikTokAuthLink = (props: TikTokAuthLinkProps) => {
  const { onFailure, onSuccess, onStart, children, className } = props

  return (
    <TikTokAuth onFailure={onFailure} onSuccess={onSuccess} onClick={onStart}>
      {/* TODO: Change to Harmony TextLink when ready */}
      <button className={className}>{children}</button>
    </TikTokAuth>
  )
}
