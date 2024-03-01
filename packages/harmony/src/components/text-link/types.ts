import type { HTMLProps } from 'react'

import type { TextProps } from 'components/text/Text'

type TextLinkTextProps = Omit<TextProps, 'variant' | 'color'>

export type TextLinkProps = TextLinkTextProps &
  Omit<
    HTMLProps<HTMLAnchorElement>,
    // Props from Text that don't match anchor props
    'size' | 'color' | 'ref'
  > & {
    /**
     * Change the default rendered element for the one passed as a child,
     *  merging their props and behavior.
     */
    asChild?: boolean

    /**
     * Which variant to display.
     * @default default
     */
    variant?: 'default' | 'subdued' | 'visible' | 'inverted' | 'secondary'

    /**
     * Which text variant to display.
     */
    textVariant?: TextProps['variant']

    /**
     * When true, always show the link underline. This can help emphasize that
     * a text-link is present when next to other text.
     */
    showUnderline?: boolean

    /**
     * Mark as true if the link destination is outside of the app. Causes the
     * link to open in a new tab.
     * @default false
     */
    isExternal?: boolean

    /**
     * Whether or not to apply styling to inner svgs.
     * Some text links may include an icon that you wish to style similarly to the text
     * (e.g. hover change colors/animations)
     */
    applyHoverStylesToInnerSvg?: boolean
  }
