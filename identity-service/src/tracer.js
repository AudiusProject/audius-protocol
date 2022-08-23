const { trace } = require('@opentelemetry/api')

const { registerInstrumentations } = require('@opentelemetry/instrumentation')
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node')
const { Resource } = require('@opentelemetry/resources')
const {
  SemanticResourceAttributes: ResourceAttributesSC
} = require('@opentelemetry/semantic-conventions')
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http')
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express')
const { BunyanInstrumentation } = require('@opentelemetry/instrumentation-bunyan')

const SERVICE_NAME = 'identity-service'

/**
 * Initializes a tracer for content node as well as registers import instrumentions
 * for packages that are frequently used
 */
const setupTracing = () => {
  /**
   * A Tracer Provider is a factory for Tracers.
   * A Tracer Provider is initialized once and its lifecycle matches the application’s lifecycle.
   * Tracer Provider initialization also includes Resource and Exporter initialization.
   * It is typically the first step in tracing with OpenTelemetry.
   */
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [ResourceAttributesSC.SERVICE_NAME]: SERVICE_NAME
    })
  })
  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      // Express instrumentation expects HTTP layer to be instrumented
      // This reads and writes the appropriate opentelemetry headers to requests
      new HttpInstrumentation(),

      // Adds spans to express routes
      new ExpressInstrumentation(),

      // Injects traceid, spanid, and SpanContext into bunyan logs
      new BunyanInstrumentation({
        // Adds a hook to logs that injects more span info
        // and the service name into logs
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

/**
 * A Tracer creates spans containing more information about what is happening
 * for a given operation, such as a request in a service.
 * Tracers are created from Tracer Providers.
 *
 * This function fetches the tracer from the application context
 * @returns {Tracer} the tracer for content node
 */
const getTracer = () => {
  return trace.getTracer(SERVICE_NAME)
}

module.exports = { setupTracing, getTracer }
