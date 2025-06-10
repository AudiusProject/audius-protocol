import { ReactNode } from 'react'

import { Flex, FlexProps } from '@audius/harmony'

import { useIsMobile } from 'hooks/useIsMobile'

export type ResponsiveModalContentProps = {
  children: ReactNode
  className?: string
  /** Props to apply to the Flex component on mobile */
  modalProps?: FlexProps
  /** Props to apply to the Flex component on desktop */
  drawerProps?: FlexProps
} & FlexProps

/**
 * A responsive content wrapper that provides appropriate padding
 * for mobile (p='l') and desktop (p='xl') contexts.
 *
 * Accepts all Flex props and provides modalProps/drawerProps for
 * platform-specific styling.
 *
 * @example
 * ```tsx
 * <ResponsiveModalContent
 *   modalProps={{ p: 'm', gap: 's' }}
 *   drawerProps={{ p: 'xl', gap: 'l' }}
 * >
 *   <p>Content with responsive padding</p>
 * </ResponsiveModalContent>
 * ```
 */
export const ResponsiveModalContent = ({
  children,
  className,
  modalProps,
  drawerProps,
  ...flexProps
}: ResponsiveModalContentProps) => {
  const isMobile = useIsMobile()

  // Default padding based on platform
  const defaultPadding = isMobile ? 'l' : 'xl'
  const defaultTopPadding = 'xl'

  // Merge default props with platform-specific props
  const platformProps = isMobile ? modalProps : drawerProps

  // Merge all props with platform-specific props taking precedence
  const mergedProps = {
    column: true,
    p: defaultPadding,
    pt: defaultTopPadding,
    ...flexProps,
    ...platformProps
  }

  return (
    <Flex className={className} {...mergedProps}>
      {children}
    </Flex>
  )
}
