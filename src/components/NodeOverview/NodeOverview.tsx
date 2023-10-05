import React from 'react'
import clsx from 'clsx'

import Paper from 'components/Paper'
import Button from 'components/Button'
import ModifyServiceModal from 'components/ModifyServiceModal'
import { ButtonType, IconPencil } from '@audius/stems'
import { ServiceType, Address } from 'types'
import { useModalControls } from 'utils/hooks'

import desktopStyles from './NodeOverview.module.css'
import mobileStyles from './NodeOverviewMobile.module.css'
import { createStyles } from 'utils/mobile'

const styles = createStyles({ desktopStyles, mobileStyles })

const messages = {
  dp: 'Discovery Node',
  cn: 'Content Node',
  title: 'SERVICE',
  version: 'VER.',
  deregistered: 'DEREGISTERED',
  endpoint: 'SERVICE ENDPOINT',
  operator: 'OPERATOR',
  delegate: 'DELEGATE OWNER WALLET',
  modify: 'Modify Service'
}

const ServiceDetail = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className={styles.descriptor}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
    </div>
  )
}

type NodeOverviewProps = {
  spID: number
  serviceType: ServiceType
  version: string
  endpoint: string
  operatorWallet: Address
  delegateOwnerWallet: Address
  isOwner: boolean
  isDeregistered: boolean
}

const NodeOverview = ({
  spID,
  serviceType,
  version,
  endpoint,
  operatorWallet,
  delegateOwnerWallet,
  isOwner,
  isDeregistered
}: NodeOverviewProps) => {
  const { isOpen, onClick, onClose } = useModalControls()

  return (
    <Paper className={styles.container}>
      <div className={styles.header}>
        <div className={styles.serviceType}>
          {serviceType === ServiceType.DiscoveryProvider
            ? messages.dp
            : messages.cn}
        </div>
        {isDeregistered ? (
          <div className={styles.deregistered}>{messages.deregistered}</div>
        ) : (
          <div className={styles.version}>
            {`${messages.version} ${version}`}
          </div>
        )}
        {isOwner && !isDeregistered && (
          <>
            <Button
              onClick={onClick}
              leftIcon={<IconPencil />}
              type={ButtonType.PRIMARY_ALT}
              text={messages.modify}
              className={clsx(styles.modifyBtn)}
              textClassName={styles.modifyBtnText}
            />
            <ModifyServiceModal
              isOpen={isOpen}
              onClose={onClose}
              spID={spID}
              serviceType={serviceType}
              endpoint={endpoint}
              delegateOwnerWallet={delegateOwnerWallet}
            />
          </>
        )}
      </div>
      <ServiceDetail label={messages.endpoint} value={endpoint} />
      <ServiceDetail label={messages.operator} value={operatorWallet} />
      {delegateOwnerWallet && (
        <ServiceDetail label={messages.delegate} value={delegateOwnerWallet} />
      )}
    </Paper>
  )
}

export default NodeOverview
