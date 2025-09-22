import { AUDIO, AudioWei } from '@audius/fixed-decimal'

import { TokenValueSlider } from 'components/token-value-slider'

import styles from './DashboardTokenValueSlider.module.css'

type DashboardTokenValueSliderProps = {
  min: AudioWei
  max: AudioWei
  value: AudioWei
}

const MinMaxWrapper = ({ value }: { value: AudioWei }) => {
  return (
    <div className={styles.minMaxWrapper}>{`${AUDIO(value)
      .trunc(0)
      .toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      })} $AUDIO`}</div>
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
