import { useTheme } from '@audius/harmony'
import cn from 'classnames'
import Color from 'color'

import { usePortal } from 'hooks/usePortal'
import { useMainContentRef } from 'pages/MainContentContext'

import styles from './HeaderGutter.module.css'

const BACKGROUND_ELEMENT_HEIGHT_PX = 161
export const BACKGROUND_ELEMENT_ID = 'headerPadding'

type HeaderGutterProps = {
  headerContainerRef?: React.RefObject<HTMLDivElement>
  scrollBarWidth?: number
  className?: string
}

/**
 * Hacky div that's Portaled out to document.body
 * with a low z-index to allow scroll bars to visually "float on top" of sticky headers.
 */
export const HeaderGutter = (props: HeaderGutterProps) => {
  const { headerContainerRef, scrollBarWidth, className } = props
  const mainContentRef = useMainContentRef()
  // Portal to the main content parent, which is the app (not body, to account for banners)
  const Portal = usePortal({
    container: mainContentRef.current?.parentElement ?? undefined
  })

  const { color, type } = useTheme()

  const gradient = `linear-gradient(180deg, ${color.background.white} 0%, ${
    color.background.white
  } 20%, ${Color(color.background.white).alpha(0.85)} 65%)`

  // Not all browsers support backdrop-filter: blur (at least at time this was intially implemented)
  // so treat it with a different gradient in those cases.

  const containerHeight =
    headerContainerRef && headerContainerRef.current
      ? headerContainerRef.current.offsetHeight
      : BACKGROUND_ELEMENT_HEIGHT_PX

  const style = {
    width: `${scrollBarWidth}px`,
    height: `${containerHeight}px`,
    background:
      type === 'debug'
        ? color.background.white
        : `rgba(0, 0, 0, 0) ${gradient} repeat scroll 0% 0%`
  }

  if (headerContainerRef === undefined || scrollBarWidth === undefined) {
    return null
  }

  return (
    <Portal>
      <div
        id={BACKGROUND_ELEMENT_ID}
        style={style}
        className={cn(styles.gutter, className)}
      />
    </Portal>
  )
}
