import { ReactElement } from 'react'

import { ExternalLink } from 'components/link'

import styles from './ProfileHeader.module.css'

type SocialLinkProps = {
  onClick: () => void
  to: string
  icon: ReactElement
}

export const SocialLink = (props: SocialLinkProps) => {
  const { icon, ...other } = props
  return (
    <ExternalLink {...other} className={styles.socialIcon}>
      {icon}
    </ExternalLink>
  )
}
