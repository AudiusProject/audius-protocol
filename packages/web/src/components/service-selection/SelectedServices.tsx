import { useState, useEffect, useCallback } from 'react'

import cn from 'classnames'
import { isEqual } from 'lodash'
import { useDispatch } from 'react-redux'

import { ReactComponent as IconInfo } from 'assets/img/iconInfo.svg'
import { getSelectedServices } from 'common/store/service-selection/selectors'
import { openModal, fetchServices } from 'common/store/service-selection/slice'
import Tooltip from 'components/tooltip/Tooltip'
import { useSelector } from 'utils/reducer'

import styles from './SelectedServices.module.css'
import { trimServiceName } from './utils'

type ServiceNameProps = {
  name: string
  last: boolean
  maxLength: number
}

const ServiceName = (props: ServiceNameProps) => {
  const { name, last, maxLength } = props
  const trimmedName = trimServiceName(name, maxLength)

  return (
    <span className={styles.serviceName}>
      <Tooltip text={name} mouseEnterDelay={0.1} mouseLeaveDelay={0.1}>
        {trimmedName}
        {!last && ', '}
      </Tooltip>
    </span>
  )
}

type SelectedServicesProps = {
  variant?: 'normal' | 'lighter'
  requiresAtLeastOne?: boolean
}

export const SelectedServices = (props: SelectedServicesProps) => {
  const { requiresAtLeastOne, variant = 'normal' } = props
  const services = useSelector(getSelectedServices, isEqual)
  const [fetchedServices, setFetchedServices] = useState(false)
  const dispatch = useDispatch()

  const show = requiresAtLeastOne ? services.length > 1 : services.length > 0

  const handleModalOpen = useCallback(() => {
    if (show) {
      dispatch(openModal())
    }
  }, [show, dispatch])

  useEffect(() => {
    if (!fetchedServices && (!services || services.length === 0)) {
      setFetchedServices(true)
      dispatch(fetchServices())
    }
  }, [services, dispatch, fetchedServices])

  return (
    <div
      className={cn(styles.selectedServices, {
        [styles.show]: show,
        [styles.lighter]: variant === 'lighter'
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
      <div className={styles.selection} onClick={handleModalOpen}>
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
