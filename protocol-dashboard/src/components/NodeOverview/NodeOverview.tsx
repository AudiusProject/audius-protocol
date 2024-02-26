import { ReactNode } from 'react'

import { ButtonType, IconArrowWhite, IconPencil } from '@audius/stems'
import clsx from 'clsx'

import IconValidationCheck from 'assets/img/iconValidationCheck.svg?react'
import IconWarning from 'assets/img/iconWarning.svg?react'
import Button from 'components/Button'
import Loading from 'components/Loading'
import ModifyServiceModal from 'components/ModifyServiceModal'
import Paper from 'components/Paper'
import RegisterServiceModal from 'components/RegisterServiceModal'
import useNodeHealth from 'hooks/useNodeHealth'
import { ServiceType, Address } from 'types'
import { useModalControls } from 'utils/hooks'
import { createStyles } from 'utils/mobile'

import desktopStyles from './NodeOverview.module.css'
import mobileStyles from './NodeOverviewMobile.module.css'

const styles = createStyles({ desktopStyles, mobileStyles })

const messages = {
  dp: 'Discovery Node',
  cn: 'Content Node',
  version: 'VER.',
  deregistered: 'DEREGISTERED',
  endpoint: 'SERVICE ENDPOINT',
  operator: 'OPERATOR',
  delegate: 'DELEGATE OWNER WALLET',
  register: 'REGISTER SERVICE',
  modify: 'MODIFY SERVICE',
  health: 'HEALTH',
  errors: 'ERRORS',
  uptime: 'UPTIME',
  diskHealth: 'DISK HEALTH',
  dbHealth: 'DATABASE HEALTH',
  healthyPeers2m: 'HEALTHY PEERS',
  chain: 'AUDIUS CHAIN',
  peerReachability: 'PEER REACHABILITY',
  uploadsCountErr: 'ERROR READING UPLOADS COUNT',
  seedingDataLabel: 'SEEDING DATA',
  failedFetch: 'Failed to fetch health data',
  peerReachabilityWarning: 'Check firewall and connection to/from peers',
  checkDiskWarning: 'Check disk/mount',
  seedingDataText: 'Awaiting completion',
  uptimeWarning: 'Failed to determine when the server last restarted',
  pending: 'Loading...'
}

type ServiceDetailProps = {
  label: string
  value: ReactNode
}

const ServiceDetail = ({ label, value }: ServiceDetailProps) => {
  return (
    <div className={styles.descriptor}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>{value}</div>
    </div>
  )
}

const TextWithIcon = ({ text, icon }: { text: string; icon: ReactNode }) => {
  return (
    <div className={styles.textWithIcon}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.text}>{text}</div>
    </div>
  )
}

type NodeOverviewProps = {
  spID?: number
  serviceType: ServiceType
  version?: string
  endpoint: string
  operatorWallet: Address
  delegateOwnerWallet?: Address
  isOwner?: boolean
  isDeregistered?: boolean
  isUnregistered?: boolean
  isLoading: boolean
}

const NodeOverview = ({
  spID,
  serviceType,
  version,
  endpoint,
  operatorWallet,
  delegateOwnerWallet,
  isOwner,
  isDeregistered,
  isUnregistered,
  isLoading
}: NodeOverviewProps) => {
  const { isOpen, onClick, onClose } = useModalControls()
  const { health, status, error } = useNodeHealth(endpoint, serviceType)

  let healthDetails = null
  if (status === 'pending') {
    healthDetails = (
      <ServiceDetail
        label={messages.health}
        value={<TextWithIcon icon={<Loading />} text={messages.pending} />}
      />
    )
  } else if (status === 'error') {
    healthDetails = (
      <ServiceDetail
        label={messages.health}
        value={
          <TextWithIcon
            icon={<IconWarning />}
            text={`${messages.failedFetch}: ${error}`}
          />
        }
      />
    )
  } else {
    healthDetails = (
      <>
        {/* First, display unhealthy aspects */}
        {health?.otherErrors && (
          <ServiceDetail
            label={messages.errors}
            value={
              <TextWithIcon
                icon={<IconWarning />}
                text={health.otherErrors.join(', ')}
              />
            }
          />
        )}
        {!health?.diskGbSize && (
          <ServiceDetail
            label={messages.diskHealth}
            value={
              <TextWithIcon
                icon={<IconWarning />}
                text={messages.checkDiskWarning}
              />
            }
          />
        )}
        {health?.dbSizeErr && (
          <ServiceDetail
            label={messages.dbHealth}
            value={
              <TextWithIcon
                icon={<IconWarning />}
                text={`Failed to read database usage: ${health?.dbSizeErr}`}
              />
            }
          />
        )}
        {health?.uploadsCountErr && (
          <ServiceDetail
            label={messages.uploadsCountErr}
            value={
              <TextWithIcon
                icon={<IconWarning />}
                text={health?.uploadsCountErr}
              />
            }
          />
        )}
        {health?.isSeeding && (
          <ServiceDetail
            label={messages.seedingDataLabel}
            value={
              <TextWithIcon
                icon={<IconWarning />}
                text={messages.seedingDataText}
              />
            }
          />
        )}
        {health?.failsPeerReachability && (
          <ServiceDetail
            label={messages.peerReachability}
            value={
              <TextWithIcon
                icon={<IconWarning />}
                text={messages.peerReachabilityWarning}
              />
            }
          />
        )}
        {health?.chainError && (
          <ServiceDetail
            label={messages.chain}
            value={
              <TextWithIcon icon={<IconWarning />} text={health.chainError} />
            }
          />
        )}
        {!health?.startedAt && (
          <ServiceDetail
            label={messages.uptime}
            value={
              <TextWithIcon
                icon={<IconWarning />}
                text={messages.uptimeWarning}
              />
            }
          />
        )}

        {/* Then, display high-level details of healthy aspects */}
        {health?.startedAt && (
          <ServiceDetail
            label={messages.uptime}
            value={
              <TextWithIcon
                icon={<>{timeSince(health.startedAt)}</>}
                text={`(${health.startedAt.toLocaleString()})`}
              />
            }
          />
        )}
        {health?.healthyPeers2m && (
          <ServiceDetail
            label={messages.healthyPeers2m}
            value={`${health?.healthyPeers2m} in the last 2 minutes`}
          />
        )}
        {health?.diskGbSize && (
          <ServiceDetail
            label={messages.diskHealth}
            value={
              <TextWithIcon
                icon={<IconValidationCheck />}
                text={`${health.diskGbUsed} / ${health.diskGbSize} GB used`}
              />
            }
          />
        )}
        {health?.dbGbUsed !== null && health?.dbGbUsed !== undefined && (
          <ServiceDetail
            label={messages.dbHealth}
            value={
              <TextWithIcon
                icon={<IconValidationCheck />}
                text={`${health?.dbGbUsed} GB used`}
              />
            }
          />
        )}
      </>
    )
  }

  return (
    <Paper className={styles.container}>
      {isLoading ? (
        <Loading className={styles.loading} />
      ) : (
        <>
          <div className={styles.header}>
            <div className={styles.serviceType}>
              {serviceType === ServiceType.DiscoveryProvider
                ? messages.dp
                : messages.cn}
            </div>
            {isDeregistered && (
              <div className={styles.deregistered}>{messages.deregistered}</div>
            )}
            {!isDeregistered && (
              <div className={styles.version}>
                {`${messages.version} ${
                  health?.version || version || 'unknown'
                }`}
              </div>
            )}
            {!isDeregistered && isUnregistered && (
              <>
                <Button
                  onClick={onClick}
                  leftIcon={<IconArrowWhite />}
                  type={ButtonType.PRIMARY}
                  text={messages.register}
                  className={clsx(styles.registerBtn)}
                  textClassName={styles.registerBtnText}
                />
                <RegisterServiceModal
                  isOpen={isOpen}
                  onClose={onClose}
                  defaultDelegateOwnerWallet={
                    delegateOwnerWallet || health?.delegateOwnerWallet || ''
                  }
                  defaultEndpoint={endpoint}
                  defaultServiceType={serviceType}
                />
              </>
            )}
            {!isDeregistered && isOwner && (
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
                  delegateOwnerWallet={health?.delegateOwnerWallet}
                />
              </>
            )}
          </div>
          <ServiceDetail label={messages.endpoint} value={endpoint} />
          {(operatorWallet || health?.operatorWallet) && (
            <ServiceDetail
              label={messages.operator}
              value={operatorWallet || health?.operatorWallet}
            />
          )}
          {(delegateOwnerWallet || health?.delegateOwnerWallet) && (
            <ServiceDetail
              label={messages.delegate}
              value={delegateOwnerWallet || health.delegateOwnerWallet}
            />
          )}
          {healthDetails}
        </>
      )}
    </Paper>
  )
}

export function RelTime({ date }: { date: Date | string }) {
  if (!date) return null
  if (typeof date === 'string') {
    date = new Date(date)
  }
  return (
    <span title={date.toLocaleString()}>
      <b>{timeSince(date)}</b> ago
    </span>
  )
}

export function timeSince(date: Date) {
  if (!date || date.toString() === '0001-01-01T00:00:00Z') return null
  if (typeof date === 'string') {
    date = new Date(date)
  }
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  return secondsToReadableDuration(seconds)
}

export function nanosToReadableDuration(nanos: number) {
  const seconds = nanos / 1e9 // Convert nanoseconds to seconds
  return secondsToReadableDuration(seconds)
}

function secondsToReadableDuration(seconds: number) {
  let interval = seconds / 31536000
  if (interval >= 1) {
    const val = Math.floor(interval)
    return val + (val > 1 ? ' years' : ' year')
  }
  interval = seconds / 2592000
  if (interval >= 1) {
    const val = Math.floor(interval)
    return val + (val > 1 ? ' months' : 'month')
  }
  interval = seconds / 86400
  if (interval >= 1) {
    const val = Math.floor(interval)
    return val + (val > 1 ? ' days' : ' day')
  }
  interval = seconds / 3600
  if (interval >= 1) {
    const val = Math.floor(interval)
    return val + (val > 1 ? ' hours' : ' hour')
  }
  interval = seconds / 60
  if (interval >= 1) {
    const val = Math.floor(interval)
    return val + (val > 1 ? ' minutes' : 'minute')
  }
  return Math.floor(seconds) + ' seconds'
}

export default NodeOverview
