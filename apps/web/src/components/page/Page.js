import { cloneElement, useRef, useState, useEffect, useCallback } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'
import { Helmet } from 'react-helmet'
import { Spring } from 'react-spring/renderprops'
import calcScrollbarWidth from 'scrollbar-width'

import SearchBar from 'components/search-bar/ConnectedSearchBar'

import styles from './Page.module.css'

const messages = {
  dotAudius: '• Audius',
  audius: 'Audius'
}

const HEADER_MARGIN_PX = 32
// Pixels on the right side of the header to account for potential scrollbars
const MIN_GUTTER_WIDTH = 20

// Responsible for positioning the header
const HeaderContainer = ({ header, containerRef }) => {
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

  // Only Safari & Chrome support the CSS
  // frosted glasss effect.
  const [isChromeOrSafari, setIsChromeOrSafari] = useState(false)
  useEffect(() => {
    const chromeOrSafari = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      return (
        userAgent.indexOf('chrome') > -1 || userAgent.indexOf('safari') > -1
      )
    }
    setIsChromeOrSafari(chromeOrSafari)
  }, [])

  const headerContainerRef = useRef()

  return (
    <div
      className={styles.headerContainer}
      ref={containerRef}
      style={{
        right: `${scrollBarWidth}px`
      }}
    >
      <div
        ref={headerContainerRef}
        className={styles.frosted}
        style={{
          // Need to set a different gradient for
          // browsers that don't support the
          // backdrop-filter frosted glass effect.
          paddingLeft: `${scrollBarWidth}px`,
          background: isChromeOrSafari
            ? 'linear-gradient(180deg, var(--page-header-gradient-1) 0%, var(--page-header-gradient-1) 20%, var(--page-header-gradient-2) 65%)'
            : 'linear-gradient(180deg, var(--page-header-gradient-1) 0%, var(--page-header-gradient-1) 40%, var(--page-header-gradient-2-alt) 85%)'
        }}
      >
        {cloneElement(header, {
          isChromeOrSafari,
          scrollBarWidth,
          headerContainerRef,
          topLeftElement: <SearchBar />
        })}
      </div>
      {/* We attach the box shadow as a separate element to
          avoid overlapping the scroll bar.
      */}
      <div className={styles.headerBoxShadow} />
    </div>
  )
}

export const Page = (props) => {
  const [headerHeight, setHeaderHeight] = useState(0)

  const calculateHeaderHeight = (element) => {
    if (element) {
      setHeaderHeight(element.offsetHeight)
    }
  }

  return (
    <Spring
      from={{ opacity: 0.2 }}
      to={{ opacity: 1 }}
      config={{ duration: props.fadeDuration }}
    >
      {(animProps) => (
        <div
          ref={props.containerRef}
          style={animProps}
          className={cn(styles.pageContainer, {
            [props.containerClassName]: !!props.containerClassName
          })}
        >
          <Helmet encodeSpecialCharacters={false}>
            {props.title ? (
              <title>{`${props.title} ${messages.dotAudius}`}</title>
            ) : (
              <title>{messages.audius}</title>
            )}
            {props.description ? (
              <meta name='description' content={props.description} />
            ) : null}
            {props.canonicalUrl && (
              <link rel='canonical' href={props.canonicalUrl} />
            )}
            {props.structuredData && (
              <script type='application/ld+json'>
                {JSON.stringify(props.structuredData)}
              </script>
            )}
          </Helmet>
          {props.header && (
            <HeaderContainer
              header={props.header}
              showSearch={props.showSearch}
              containerRef={calculateHeaderHeight}
            />
          )}
          <div
            className={cn({
              [styles.inset]: props.variant === 'inset',
              [styles.flush]: props.variant === 'flush',
              [styles.medium]: props.size === 'medium',
              [styles.large]: props.size === 'large',
              [props.containerClassName]: !!props.containerClassName
            })}
            style={
              props.variant === 'inset'
                ? { paddingTop: `${headerHeight + HEADER_MARGIN_PX}px` }
                : null
            }
          >
            {/* Set an id so that nested components can mount in relation to page if needed, e.g. fixed menu popups. */}
            <div
              id='page'
              className={cn(styles.pageContent, {
                [props.contentClassName]: !!props.contentClassName
              })}
            >
              {props.children}
            </div>
          </div>
          {props.scrollableSearch && (
            <div className={styles.searchWrapper}>
              <SearchBar />
            </div>
          )}
        </div>
      )}
    </Spring>
  )
}

Page.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  canonicalUrl: PropTypes.string,
  structuredData: PropTypes.object,
  variant: PropTypes.oneOf(['inset', 'flush']),
  size: PropTypes.oneOf(['medium', 'large']),
  containerRef: PropTypes.node,
  contentClassName: PropTypes.string,
  containerClassName: PropTypes.string,
  fadeDuration: PropTypes.number,
  header: PropTypes.node,

  // There are some pages which don't have a fixed header but still display
  // a search bar that scrolls with the page.
  scrollableSearch: PropTypes.bool,
  children: PropTypes.node
}

Page.defaultProps = {
  variant: 'inset',
  size: 'medium',
  fadeDuration: 200,
  scrollableSearch: false
}

export default Page
