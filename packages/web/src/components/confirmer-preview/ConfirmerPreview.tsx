import React from 'react'

import { connect } from 'react-redux'

import { useDevModeHotkey } from 'hooks/useHotkey'
import { AppState } from 'store/types'

import styles from './ConfirmerPreview.module.css'

type ConfirmerPreviewProps = {} & ReturnType<typeof mapStateToProps>

const ConfirmerPreview = ({ confirmer }: ConfirmerPreviewProps) => {
  const entities = Object.keys(confirmer.confirm)
  const isEnabled = useDevModeHotkey(67 /* c */)
  if (!isEnabled) return null

  return (
    <div className={styles.container}>
      <div className={styles.title}>Confirmer Preview</div>
      <div className={styles.inProgressTitle}>In Progress calls</div>
      <div className={styles.inProgress}>
        {entities.length
          ? entities.map(entity => {
              return (
                <div className={styles.entity} key={entity}>
                  <div className={styles.entityName}>{entity}</div>
                  <div className={styles.index}>
                    In Progress Call: #{' '}
                    {confirmer.confirm[(entity as unknown) as number].index}
                  </div>
                  <div className={styles.calls}>
                    {confirmer.confirm[(entity as unknown) as number].calls.map(
                      (call, i) => {
                        return (
                          <div className={styles.call} key={i}>
                            {i}. result: {call.result === null ? '-' : 'done'}
                          </div>
                        )
                      }
                    )}
                  </div>
                </div>
              )
            })
          : 'None'}
      </div>
    </div>
  )
}

function mapStateToProps(state: AppState) {
  return {
    confirmer: state.confirmer
  }
}

export default connect(mapStateToProps)(ConfirmerPreview)
