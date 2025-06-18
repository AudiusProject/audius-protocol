import { formatNumberCommas } from '@audius/common/utils'
import { FixedDecimal } from '@audius/fixed-decimal'

import { TokenValueSlider } from 'components/token-value-slider'

import styles from './DashboardTokenValueSlider.module.css'

type DashboardTokenValueSliderProps = {
  min: FixedDecimal
  max: FixedDecimal
  value: FixedDecimal
}

const MinMaxWrapper = ({ value }: { value: FixedDecimal }) => {
  return (
    <div className={styles.minMaxWrapper}>{`${formatNumberCommas(
      value.trunc(0).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })
    )} $AUDIO`}</div>
  )
}

const DashboardTokenValueSlider = (props: DashboardTokenValueSliderProps) => {
  const { min, max, value } = props

  return (
    <TokenValueSlider
      className={styles.sliderContainer}
      sliderClassName={styles.slider}
      min={min}
      max={max}
      value={value}
      minSliderWidth={4}
      isIncrease={true}
      minWrapper={MinMaxWrapper}
      maxWrapper={MinMaxWrapper}
    />
  )
}

export default DashboardTokenValueSlider
