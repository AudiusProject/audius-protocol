import { Component } from 'react'

import { IconCreateAccount as icon } from '@audius/harmony'
import cn from 'classnames'
import { connect } from 'react-redux'

import { openSignOn } from 'common/store/pages/signon/actions'

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
