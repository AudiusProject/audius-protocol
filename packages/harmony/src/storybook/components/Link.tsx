import type { ReactNode } from 'react'

import LinkTo from '@storybook/addon-links/react'

type LinkProps = { className?: string; children?: ReactNode } & (
  | { href: string }
  | { kind: string; story: string }
)

export const Link = (props: LinkProps) => {
  const { className, children, ...other } = props

  if ('href' in other) {
    const { href } = other
    return (
      <a className={className} href={href} target='_blank' rel='noreferrer'>
        {children}
      </a>
    )
  }

  const { kind, story } = other
  return (
    // @ts-expect-error className is available
    <LinkTo className={className} kind={kind} story={story}>
      {children}
    </LinkTo>
  )
}
