from opentelemetry import trace
from opentelemetry.exporter.jaeger.thrift import JaegerExporter
from opentelemetry.instrumentation.celery import CeleryInstrumentor
from opentelemetry.instrumentation.logging import LoggingInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.instrumentation.sqlalchemy import SQLAlchemyInstrumentor
from opentelemetry.sdk.resources import SERVICE_NAME, Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor


def configure_tracer():
    trace.set_tracer_provider(
        TracerProvider(resource=Resource.create({SERVICE_NAME: "discovery-provider"})),
    )

    jaeger_exporter = JaegerExporter(
        agent_host_name="jaeger",
        agent_port=6832,
    )

    trace.get_tracer_provider().add_span_processor(
        SimpleSpanProcessor(jaeger_exporter),
    )

    LoggingInstrumentor().instrument()
    RequestsInstrumentor().instrument()
    SQLAlchemyInstrumentor().instrument()
    CeleryInstrumentor().instrument()
