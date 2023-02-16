package telemetry

import (
	"io"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.17.0"
	"go.opentelemetry.io/otel/trace"

	"go.opentelemetry.io/otel/attribute"
)

const (
	serviceName = "storage"
	version     = "v0.1.0"
	environment = "stage"
)

var tracer trace.Tracer

// newResource returns a resource describing this application.
func newResource() *resource.Resource {
	r, _ := resource.Merge(
		resource.Default(),
		resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceNameKey.String(serviceName),
			semconv.ServiceVersionKey.String(version),
			attribute.String("environment", environment),
		),
	)
	return r
}

func InitTracing(w io.Writer) *sdktrace.TracerProvider {

	r := newResource()

	// Create a new tracer provider with a batch span processor and the given exporter.
	tp := sdktrace.NewTracerProvider(
		sdktrace.WithResource(r),
	)

	otel.SetTracerProvider(tp)

	// Finally, set the tracer that can be used for this package.
	tracer = tp.Tracer(serviceName)

	return tp
}
