import {
  trace,
  diag,
  DiagConsoleLogger,
  DiagLogLevel
} from '@opentelemetry/api'

import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { ConsoleSpanExporter } from '@opentelemetry/tracing'
import { Resource } from '@opentelemetry/resources'
import {
  // SemanticAttributes,
  SemanticResourceAttributes as ResourceAttributesSC
} from '@opentelemetry/semantic-conventions'
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis'
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { BunyanInstrumentation } from '@opentelemetry/instrumentation-bunyan'
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg'

// Not functionally required but gives some insight what happens behind the scenes
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO)

export const setupTracing = (serviceName: string) => {
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [ResourceAttributesSC.SERVICE_NAME]: serviceName
    })
  })
  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      // Express instrumentation expects HTTP layer to be instrumented
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new RedisInstrumentation(),
      new PgInstrumentation(),
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

  return trace.getTracer(serviceName)
}

module.exports = { setupTracing }
