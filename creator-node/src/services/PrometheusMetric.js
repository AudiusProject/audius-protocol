const client = require('prom-client');


const PrometheusType = Object.freeze({
    HISTOGRAM: 'histogram',
    GAUGE: 'gauge'
})

class PrometheusMetric {
    static histograms = {}
    static gauges = {}
    static registeredCollectors = {}

    _initMetric(name, description, labelNames, collection, PrometheusMetricClass) {
        if (!(name in collection)) {
            collection[name] = new PrometheusMetricClass({
                name: name,
                help: description,
                labelNames: labelNames
            })
        }
        this.metric = collection[name]
    }

    constructor(name, description, labelNames, metric_type) {
        this.resetTimer()

        // set metric prefix of audius_project_
        name = `audius_cn_${name}`

        this.metricType = metric_type
        if (this.metricType === undefined) {
            this.metricType = PrometheusType.HISTOGRAM
        }

        // CollectorRegistries must be uniquely named
        // NOTE: we only set labelNames once.
        // unsure if overloading is supported.
        if (this.metricType == PrometheusType.HISTOGRAM) {
            this._initMetric(
                name,
                description,
                labelNames,
                PrometheusMetric.histograms,
                client.Histogram
            )
        } else if (this.metricType == PrometheusType.GAUGE) {
            this._initMetric(name,
                description,
                labelNames,
                PrometheusMetric.gauges,
                client.Gauge
            )
        } else {
            throw new Error(`metric_type '${this.metricType}' not found`)
        }
    }

    resetTimer() {
        this.startTime = Date.now()
    }

    elapsed(startTime) {
        if (startTime === undefined) {
            startTime = this.startTime
        }
        return Date.now() - startTime
    }

    saveTime(labels, startTime) {
        this.save(this.elapsed(startTime), labels)
    }

    save(value, labels) {
        let thisMetric = this.metric
        if (labels !== undefined) {
            thisMetric = thisMetric.labels(labels)
        }

        if (this.metricType == PrometheusType.HISTOGRAM) {
            thisMetric.observe(value)
        } else if (this.metricType == PrometheusType.GAUGE) {
            thisMetric.set(value)
        }
    }

    static registerCollector(name, collectorFunc) {
        PrometheusMetric.registeredCollectors[name] = collectorFunc
    }

    static populateCollectors(name, collectorFunc) {
        for (let collectorFunc of Object.values(PrometheusMetric.registeredCollectors)) {
            collectorFunc()
        }
    }
}

module.exports = PrometheusMetric
