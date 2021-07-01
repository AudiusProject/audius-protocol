import React, { Component } from 'react'

import cn from 'classnames'
import { connect } from 'react-redux'

import icon from 'assets/img/iconCreateAccount.svg'
import { openSignOn } from 'containers/sign-on/store/actions'

import styles from './ButtonCreateAccount.module.css'

class ButtonCreateAccount extends Component {
  clicked = () => {
    this.props.dispatch(openSignOn(false))
  }

  render() {
    return (
      <button
        className={cn(styles.bigButton, styles.navbar)}
        onClick={this.clicked}
      >
        <img className={styles.icon} src={icon} alt='Icon upload' />
        Create Account
      </button>
    )
  }
}
export default connect()(ButtonCreateAccount)
