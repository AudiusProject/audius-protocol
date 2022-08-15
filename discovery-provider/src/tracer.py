from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter

from opentelemetry.instrumentation.logging import LoggingInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor

from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor


def configure_tracer():
    trace.set_tracer_provider(
        TracerProvider(resource=Resource.create({SERVICE_NAME: "discovery-provider"})),
    )
    LoggingInstrumentor().instrument()
    RequestsInstrumentor().instrument()
