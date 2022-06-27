const _ = require('lodash')

/**
 * Creates 'count' buckets, where the lowest bucket is 'min' and the highest bucket is 'max'.
 * The final +Inf bucket is not counted and not included in the returned array.
 * The returned array is meant to be used for the buckets field of metricConfig.
 * Throws if 'count' is 0 or negative, if 'min' is 0 or negative.
 *
 * Uses an implementation similar to the Golang client's ExponentialBucketsRange function:
 * https://github.com/prometheus/client_golang/blob/v1.12.2/prometheus/histogram.go#L125
 *
 * See prom-client (JS) proposed implementation that was never completed:
 * https://github.com/siimon/prom-client/issues/213
 *
 * @param {number} min the lowest value for a bucket
 * @param {number} max the highest value for a bucket
 * @param {number} count the number of buckets to generate for values between min and max
 * @param {number} [precision] the number of decimal points to round each bucket to
 * @returns 'count' buckets (number[] of length 'count') for values between 'min' and 'max'
 */
const exponentialBucketsRange = (min, max, count, precision = 0) => {
  if (count < 1) {
    throw new Error('exponentialBucketsRange count needs a positive count')
  }
  if (min <= 0) {
    throw new Error('ExponentialBucketsRange min needs to be greater than 0')
  }

  // Formula for exponential buckets: max = min*growthFactor^(bucketCount-1)

  // We know max/min and highest bucket. Solve for growthFactor
  const growthFactor = (max / min) ** (1 / (count - 1))

  // Now that we know growthFactor, solve for each bucket
  const buckets = []
  for (let i = 1; i <= count; i++) {
    const bucket = min * growthFactor ** (i - 1)
    buckets.push(_.round(bucket, precision))
  }
  return buckets
}

module.exports = {}
module.exports.exponentialBucketsRange = exponentialBucketsRange
