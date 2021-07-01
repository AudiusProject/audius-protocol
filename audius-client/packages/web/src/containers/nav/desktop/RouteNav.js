import React from 'react'

import { goBack, goForward } from 'connected-react-router'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'

import { ReactComponent as IconCaretRight } from 'assets/img/iconCaretRight.svg'

import styles from './RouteNav.module.css'

const RouteNav = props => {
  return (
    <div className={styles.wrapper}>
      <IconCaretRight className={styles.backButton} onClick={props.back} />
      <IconCaretRight
        className={styles.forwardButton}
        onClick={props.forward}
      />
    </div>
  )
}

const mapStateToProps = state => ({})

const mapDispatchToProps = dispatch => ({
  back: () => dispatch(goBack()),
  forward: () => dispatch(goForward())
})

export default withRouter(
  connect(mapStateToProps, mapDispatchToProps)(RouteNav)
)
