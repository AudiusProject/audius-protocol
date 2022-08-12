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
  // SemanticAttributes,
  SemanticResourceAttributes: ResourceAttributesSC
} = require('@opentelemetry/semantic-conventions')
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http')

const { JaegerExporter } = require('@opentelemetry/exporter-jaeger')
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base')

// Not functionally required but gives some insight what happens behind the scenes
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO)

const SERVICE_NAME = 'service-commands'

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
      new HttpInstrumentation()
    ]
  })

  const exporter = new JaegerExporter({
    tags: [], // optional
    // You can use the default UDPSender
    host: 'localhost', // optional
    port: 6832, // optional
    // OR you can use the HTTPSender as follows
    // endpoint: 'http://localhost:14268/api/traces',
    maxPacketSize: 65000 // optional
  })

  provider.addSpanProcessor(new SimpleSpanProcessor(exporter))

  // Initialize the OpenTelemetry APIs to use the NodeTracerProvider bindings
  provider.register()
}

const getTracer = () => {
  return trace.getTracer(SERVICE_NAME)
}

module.exports = { setupTracing, getTracer }
