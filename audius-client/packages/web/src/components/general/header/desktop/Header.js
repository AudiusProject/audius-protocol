import React, { useRef, useEffect } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'

import BackButton from 'components/general/BackButton'

import styles from './Header.module.css'

const BACKGROUND_ELEMENT_HEIGHT_PX = 161
export const BACKGROUND_ELEMENT_ID = 'headerPadding'

const Header = props => {
  const {
    primary,
    secondary = null,
    rightDecorator = null,
    topLeftElement = null,
    children,
    variant,
    containerStyles,
    wrapperClassName,
    showBackButton,
    onClickBack,
    bottomBar,
    overrideWidth = null,
    isChromeOrSafari,
    scrollBarWidth,
    headerContainerRef
  } = props

  const backgroundElementRef = useRef(null)
  useEffect(() => {
    if (!backgroundElementRef.current) {
      const el = document.createElement('div')
      el.id = BACKGROUND_ELEMENT_ID
      document.body.appendChild(el)
      backgroundElementRef.current = el
    }

    const background = isChromeOrSafari
      ? 'linear-gradient(180deg, var(--page-header-gradient-1) 0%, var(--page-header-gradient-1) 20%, var(--page-header-gradient-2) 65%)'
      : 'linear-gradient(180deg, var(--page-header-gradient-1) 0%, var(--page-header-gradient-1) 40%, var(--page-header-gradient-2-alt) 85%)'

    const containerHeight =
      headerContainerRef && headerContainerRef.current
        ? headerContainerRef.current.offsetHeight
        : BACKGROUND_ELEMENT_HEIGHT_PX

    backgroundElementRef.current.style = `width: ${scrollBarWidth}px;
      height: ${containerHeight}px;
      right: 0px;
      position: fixed;
      background: rgba(0, 0, 0, 0) ${background} repeat scroll 0% 0%;
      box-shadow: rgba(133, 129, 153, 0.18) 1px 2px 5px -2px;
      z-index: -1;
    `
  }, [isChromeOrSafari, scrollBarWidth, headerContainerRef])

  useEffect(
    () => () => {
      document.body.removeChild(backgroundElementRef.current)
      backgroundElementRef.current = null
    },
    []
  )

  const variantStyle = {
    [styles.main]: variant === 'main',
    [styles.mini]: variant === 'mini',
    [styles.section]: variant === 'section',
    [styles.page]: variant === 'page'
  }

  return (
    <>
      <div
        className={cn(
          styles.container,
          variantStyle,
          { [containerStyles]: !!containerStyles },
          { [styles.containerWithBar]: !!bottomBar }
        )}
      >
        <div
          className={cn(styles.maxWidthWrapper, {
            [styles.maxWithWrapperWithBar]: !!bottomBar
          })}
        >
          <div
            className={styles.middleRow}
            style={overrideWidth !== null ? { maxWidth: overrideWidth } : null}
          >
            <div className={cn(styles.headerWrapper, wrapperClassName)}>
              {showBackButton ? (
                <BackButton
                  onClickBack={onClickBack}
                  className={styles.backButton}
                />
              ) : null}
              <h1 className={cn(styles.header, variantStyle)}>{primary}</h1>
              <h2 className={styles.secondary}>{secondary}</h2>
            </div>
            <div className={styles.rightDecorator}>{rightDecorator}</div>
          </div>
        </div>
        {children}
        {topLeftElement && (
          <div className={styles.topLeftWrapper}>{topLeftElement}</div>
        )}
      </div>
      {bottomBar && (
        <div className={styles.bottomBarContainer}>
          <div className={styles.bottomBar}>{bottomBar}</div>
        </div>
      )}
    </>
  )
}

Header.propTypes = {
  primary: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  topLeftElement: PropTypes.node, // e.g. searchbar
  bottomBar: PropTypes.node, // e.g. tabs
  secondary: PropTypes.node,
  rightDecorator: PropTypes.node,
  variant: PropTypes.oneOf(['main', 'mini', 'section', 'page']),
  containerStyles: PropTypes.string,
  wrapperClassName: PropTypes.string,
  showBackButton: PropTypes.bool,
  onClickBack: PropTypes.func,
  overrideWidth: PropTypes.number
}

Header.defaultProps = {
  variant: 'main',
  containerStyles: '',
  showBackButton: false,
  onClickBack: () => {}
}

export default Header
