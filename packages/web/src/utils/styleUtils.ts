import { CSSObject } from '@emotion/react'

type BackgroundOverlayArgs = {
  color: string
  opacity: number
}

/** Renders a background overlay using a pseudo element to avoid affecting opacity
 * on children or the background of the element itself.
 */
export const backgroundOverlay = ({
  color,
  opacity
}: BackgroundOverlayArgs): CSSObject => ({
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '100%',
    backgroundColor: color,
    opacity
  }
})
