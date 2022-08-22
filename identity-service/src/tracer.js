const {
    trace,
    diag,
    DiagConsoleLogger,
    DiagLogLevel
  } = require('@opentelemetry/api')
  
  const { registerInstrumentations } = require('@opentelemetry/instrumentation')
  const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node')
  const { Resource } = require('@opentelemetry/resources')
  const {
    SemanticResourceAttributes: ResourceAttributesSC
  } = require('@opentelemetry/semantic-conventions')
  const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http')
  const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express')
  const { BunyanInstrumentation } = require('@opentelemetry/instrumentation-bunyan')
  
  // Not functionally required but gives some insight what happens behind the scenes
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO)
  
  const SERVICE_NAME = 'identity-service'
  
  const setupTracing = () => {
    const provider = new NodeTracerProvider({
      resource: new Resource({
        [ResourceAttributesSC.SERVICE_NAME]: SERVICE_NAME
      })
    })
    registerInstrumentations({
      tracerProvider: provider,
      instrumentations: [
        // Express instrumentation expects HTTP layer to be instrumented
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
        new BunyanInstrumentation({
          logHook: (span, record) => {
            record['resource.span'] = span
            record['resource.service.name'] =
              provider.resource.attributes['service.name']
          }
        })
      ]
    })
  
    // Initialize the OpenTelemetry APIs to use the NodeTracerProvider bindings
    provider.register()
  }
  
  const getTracer = () => {
    return trace.getTracer(SERVICE_NAME)
  }
  
  module.exports = { setupTracing, getTracer }