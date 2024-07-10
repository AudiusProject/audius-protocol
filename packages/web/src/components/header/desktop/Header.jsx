import cn from 'classnames'
import PropTypes from 'prop-types'

import { BackButton } from 'components/back-button/BackButton'
import { HeaderGutter } from 'components/header/desktop/HeaderGutter'

import styles from './Header.module.css'

const Header = (props) => {
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

  const variantStyle = {
    [styles.main]: variant === 'main',
    [styles.mini]: variant === 'mini',
    [styles.section]: variant === 'section',
    [styles.page]: variant === 'page'
  }

  return (
    <>
      <HeaderGutter
        isChromeOrSafari={isChromeOrSafari}
        headerContainerRef={headerContainerRef}
        scrollBarWidth={scrollBarWidth}
      />
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
              {showBackButton ? <BackButton onClick={onClickBack} /> : null}
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
