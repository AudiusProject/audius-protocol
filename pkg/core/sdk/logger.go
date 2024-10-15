package sdk

import "github.com/AudiusProject/audius-protocol/pkg/core/common"

type Logger interface {
	Debug(msg string, args ...interface{})
	Info(msg string, args ...interface{})
	Warn(msg string, args ...interface{})
	Error(msg string, args ...interface{})
}

// NoOpLogger is a logger that does nothing.
type NoOpLogger struct{}

// NewNoOpLogger creates a new NoOpLogger instance.
func NewNoOpLogger() *NoOpLogger {
	return &NoOpLogger{}
}

func (l *NoOpLogger) Debug(msg string, args ...interface{}) {}

func (l *NoOpLogger) Info(msg string, args ...interface{}) {}

func (l *NoOpLogger) Warn(msg string, args ...interface{}) {}

func (l *NoOpLogger) Error(msg string, args ...interface{}) {}

// type assertion that logger in common and noop implement sdk logger interface
var _ Logger = (*common.Logger)(nil)
var _ Logger = (*NoOpLogger)(nil)
