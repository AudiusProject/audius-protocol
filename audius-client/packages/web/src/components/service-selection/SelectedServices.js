import React, { useState, useEffect } from 'react'

import cn from 'classnames'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'

import { ReactComponent as IconInfo } from 'assets/img/iconInfo.svg'
import Tooltip from 'components/tooltip/Tooltip'

import styles from './SelectedServices.module.css'
import { getSelectedServices } from './store/selectors'
import { openModal, fetchServices } from './store/slice'
import { trimServiceName } from './utils'

const ServiceName = props => {
  const trimmedName = trimServiceName(props.name)

  return (
    <span className={styles.serviceName}>
      <Tooltip text={props.name} mouseEnterDelay={0.1} mouseLeaveDelay={0.1}>
        {trimmedName}
        {!props.last && ', '}
      </Tooltip>
    </span>
  )
}

const SelectedServices = props => {
  const [fetchedServices, setFetchedServices] = useState(false)

  const { services, fetchServices } = props

  useEffect(() => {
    if (!fetchedServices && (!services || services.length === 0)) {
      setFetchedServices(true)
      fetchServices()
    }
  }, [services, fetchServices, fetchedServices])

  const show = props.requiresAtLeastOne
    ? services.length > 1
    : services.length > 0

  return (
    <div
      className={cn(styles.selectedServices, {
        [styles.show]: show,
        [styles.lighter]: props.variant === 'lighter'
      })}
    >
      <div className={styles.services}>
        {`Selected Servers: `}
        {services.map((service, i) => (
          <ServiceName
            key={service}
            name={service}
            maxLength={20}
            last={i === services.length - 1}
          />
        ))}
      </div>
      <div
        className={styles.selection}
        onClick={show ? props.openModal : () => {}}
      >
        Change Servers (Advanced)
      </div>
      <Tooltip
        text={`Configure which servers host your content. This is an advanced feature. Make sure you know what you're doing!`}
        mouseEnterDelay={0.1}
        mouseLeaveDelay={0.1}
      >
        <IconInfo className={styles.iconInfo} />
      </Tooltip>
    </div>
  )
}

SelectedServices.propTypes = {
  services: PropTypes.arrayOf(PropTypes.string),
  variant: PropTypes.oneOf(['normal', 'lighter']),
  requiresAtLeastOne: PropTypes.bool
}

SelectedServices.defaultProps = {
  variant: 'normal'
}

const mapStateToProps = state => ({
  services: getSelectedServices(state)
})

const mapDispatchToProps = dispatch => ({
  openModal: () => dispatch(openModal()),
  fetchServices: () => dispatch(fetchServices())
})

export default connect(mapStateToProps, mapDispatchToProps)(SelectedServices)
