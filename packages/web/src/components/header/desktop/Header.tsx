import { ReactNode } from 'react'

import cn from 'classnames'
import { useNavigate } from 'react-router-dom'

import { BackButton } from 'components/back-button/BackButton'
import { HeaderGutter } from 'components/header/desktop/HeaderGutter'

import styles from './Header.module.css'

export type HeaderProps = {
  primary: ReactNode
  topLeftElement?: ReactNode // e.g. searchbar
  bottomBar?: ReactNode // e.g. tabs
  secondary?: ReactNode
  rightDecorator?: ReactNode
  variant?: 'main' | 'mini' | 'section' | 'page'
  containerStyles?: string
  wrapperClassName?: string
  showBackButton?: boolean
  onClickBack?: () => void
  overrideWidth?: number
  children?: ReactNode
  isChromeOrSafari?: boolean
  scrollBarWidth?: number
  headerContainerRef?: React.RefObject<HTMLDivElement>
}

const Header = (props: HeaderProps) => {
  const {
    primary,
    secondary = null,
    rightDecorator = null,
    topLeftElement = null,
    children,
    variant = 'main',
    containerStyles = '',
    wrapperClassName,
    showBackButton = false,
    onClickBack,
    bottomBar,
    overrideWidth = null,
    isChromeOrSafari,
    scrollBarWidth,
    headerContainerRef
  } = props

  const navigate = useNavigate()

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
            style={overrideWidth !== null ? { maxWidth: overrideWidth } : {}}
          >
            <div className={cn(styles.headerWrapper, wrapperClassName)}>
              {showBackButton ? (
                <BackButton onClick={onClickBack ?? (() => navigate(-1))} />
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

export default Header
