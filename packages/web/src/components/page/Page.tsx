import {
  ReactNode,
  cloneElement,
  useRef,
  useState,
  useEffect,
  useCallback,
  MutableRefObject
} from 'react'

import { Nullable } from '@audius/common/utils'
import { Flex, useTheme } from '@audius/harmony'
import cn from 'classnames'
import Color from 'color'
// eslint-disable-next-line no-restricted-imports -- TODO: migrate to @react-spring/web
import { animated, useSpring } from 'react-spring'
// @ts-ignore
import calcScrollbarWidth from 'scrollbar-width'

import { HeaderGutter } from 'components/header/desktop/HeaderGutter'
import { MetaTags, MetaTagsProps } from 'components/meta-tags/MetaTags'
import SearchBar from 'components/search-bar/ConnectedSearchBar'

import styles from './Page.module.css'

const HEADER_MARGIN_PX = 32
// Pixels on the right side of the header to account for potential scrollbars
const MIN_GUTTER_WIDTH = 20

// Responsible for positioning the header
type HeaderContainerProps = Pick<PageProps, 'header' | 'showSearch'> & {
  containerRef: (element: Nullable<HTMLElement>) => void
}

const HeaderContainer = (props: HeaderContainerProps) => {
  const { header, containerRef, showSearch } = props

  // Need to offset the header on the right side
  // the width of the scrollbar.
  const [scrollBarWidth, setScrollbarWidth] = useState(0)

  const refreshScrollWidth = useCallback(() => {
    const width = calcScrollbarWidth(true)
    // For some odd reason, narrow windows ONLY in Firefox
    // return 0 width for the scroll bars.
    setScrollbarWidth(width > 0 ? width : MIN_GUTTER_WIDTH)
  }, [])

  useEffect(() => {
    refreshScrollWidth()
  }, [refreshScrollWidth])

  const headerContainerRef = useRef<HTMLDivElement>(null)

  const { color, type } = useTheme()

  const background =
    type === 'debug'
      ? color.background.white
      : `linear-gradient(180deg, ${color.background.white} 0%, ${
          color.background.white
        } 20%, ${Color(color.background.white).alpha(0.85)} 65%)`

  return (
    <div
      className={styles.headerContainer}
      ref={containerRef}
      css={{ right: scrollBarWidth }}
    >
      <Flex
        css={{
          backdropFilter: 'blur(10px)',
          position: 'relative',
          zIndex: 10,
          paddingLeft: scrollBarWidth,
          background
        }}
        ref={headerContainerRef}
      >
        <HeaderGutter
          headerContainerRef={headerContainerRef}
          scrollBarWidth={scrollBarWidth}
        />
        {cloneElement(header as any, {
          topLeftElement: showSearch ? <SearchBar /> : null
        })}
      </Flex>
      {/* We attach the box shadow as a separate element to
          avoid overlapping the scroll bar.
      */}
      <div className={styles.headerBoxShadow} />
    </div>
  )
}

type PageProps = {
  variant?: 'insert' | 'flush'
  size?: 'medium' | 'large'
  containerRef?: MutableRefObject<any>
  className?: string
  contentClassName?: string
  containerClassName?: string
  fromOpacity?: number
  fadeDuration?: number
  header?: ReactNode

  // There are some pages which don't have a fixed header but still display
  // a search bar that scrolls with the page.
  scrollableSearch?: boolean
  children?: ReactNode
  showSearch?: boolean
} & MetaTagsProps

export const Page = (props: PageProps) => {
  const {
    canonicalUrl,
    children,
    containerClassName,
    containerRef,
    contentClassName,
    description,
    fadeDuration = 200,
    fromOpacity = 0.2,
    header,
    image,
    noIndex = false,
    ogDescription,
    scrollableSearch = false,
    showSearch = true,
    size = 'medium',
    structuredData,
    title,
    variant = 'inset'
  } = props

  const [headerHeight, setHeaderHeight] = useState(0)

  const calculateHeaderHeight = (element: Nullable<HTMLElement>) => {
    if (element) {
      setHeaderHeight(element.offsetHeight)
    }
  }

  const metaTagsProps = {
    title,
    description,
    ogDescription,
    image,
    canonicalUrl,
    structuredData,
    noIndex
  }
  const springProps = useSpring({
    from: { opacity: fromOpacity },
    opacity: 1,
    config: { duration: fadeDuration }
  })

  return (
    <>
      <MetaTags {...metaTagsProps} />
      <animated.div
        ref={containerRef}
        style={springProps}
        className={cn(
          styles.pageContainer,
          props.containerClassName,
          props.className
        )}
      >
        {header && (
          <HeaderContainer
            header={header}
            showSearch={showSearch}
            containerRef={calculateHeaderHeight}
          />
        )}
        <div
          className={cn({
            [styles.inset]: variant === 'inset',
            [styles.flush]: variant === 'flush',
            [styles.medium]: size === 'medium',
            [styles.large]: size === 'large',
            [containerClassName ?? '']: !!containerClassName
          })}
          style={
            variant === 'inset'
              ? { paddingTop: `${headerHeight + HEADER_MARGIN_PX}px` }
              : undefined
          }
        >
          {/* Set an id so that nested components can mount in relation to page if needed, e.g. fixed menu popups. */}
          <div
            id='page'
            className={cn(styles.pageContent, {
              [contentClassName ?? '']: !!contentClassName
            })}
          >
            {children}
          </div>
        </div>

        {scrollableSearch && (
          <div className={styles.searchWrapper}>
            <SearchBar />
          </div>
        )}
      </animated.div>
    </>
  )
}

export default Page
