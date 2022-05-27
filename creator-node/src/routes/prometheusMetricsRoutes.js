module.exports = function (app) {
  app.get('/prometheus_metrics', async (req, res) => {
    const prometheusRegistry = req.app.get('serviceRegistry').prometheusRegistry

    try {
      res.setHeader('Content-Type', prometheusRegistry.register.contentType)
      res.send(await prometheusRegistry.getAllMetricData())
    } catch (e) {
      // TODO
    }
  })
}
