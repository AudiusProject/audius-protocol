import Error from 'components/Error'
import Loading from 'components/Loading'
import React from 'react'
import Paper from 'components/Paper'
import { createStyles } from 'utils/mobile'

import desktopStyles from './TrackerChart.module.css'
import mobileStyles from './TrackerChartMobile.module.css'

const styles = createStyles({ desktopStyles, mobileStyles })

type OwnProps = {
  title: string
  subtitle?: string
  data: DataObject[] | null
  error?: boolean
}

type TrackerChartProps = OwnProps

export type DataObject = {
  color: string
  tooltip: string
}

const TrackerChart: React.FC<TrackerChartProps> = ({
  title,
  subtitle,
  data,
  error
}) => {
  const [tooltipText, setTooltipText] = React.useState('')
  const [showTooltip, setShowTooltip] = React.useState(false)

  return (
    <Paper className={styles.chartContainer}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
      </div>
      <div className={styles.chart}>
        {error ? (
          <Error />
        ) : data && data.length >= 2 ? (
          <div className={styles.trackerContainer}>
            <div className={styles.labelContainer}>
              <div className={styles.label} style={{ textAlign: 'left' }}>
                {data[0].tooltip}
              </div>
              <div className={styles.label} style={{ textAlign: 'right' }}>
                {data[data.length - 1].tooltip}
              </div>
            </div>
            <div className={styles.trackerCells}>
              {data.map((item, index) => (
                <div
                  key={index}
                  className={styles.trackerCell}
                  style={{ backgroundColor: item.color }}
                  onMouseEnter={() => {
                    setTooltipText(item.tooltip)
                    setShowTooltip(true)
                  }}
                  onMouseLeave={() => setShowTooltip(false)}
                />
              ))}
              {showTooltip && (
                <div className={styles.tooltip}>{tooltipText}</div>
              )}
            </div>
          </div>
        ) : (
          <Loading className={styles.loading} />
        )}
      </div>
    </Paper>
  )
}

export default TrackerChart
