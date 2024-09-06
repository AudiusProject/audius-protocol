package common

import (
	"fmt"
	"log/slog"
	"os"

	"github.com/cometbft/cometbft/libs/log"
)

type Logger struct {
	log slog.Logger
}

func NewLogger(opts *slog.HandlerOptions) *Logger {
	logger := *slog.New(slog.NewJSONHandler(os.Stdout, opts))
	return &Logger{
		log: logger,
	}
}

func (l *Logger) Child(serviceName string) *Logger {
	return &Logger{
		log: *l.log.With("service", serviceName),
	}
}

func (l *Logger) Debug(msg string, keyvals ...interface{}) {
	l.log.Debug(msg, keyvals...)
}

func (l *Logger) Info(msg string, keyvals ...interface{}) {
	l.log.Info(msg, keyvals...)
}

func (l *Logger) Warn(msg string, keyvals ...interface{}) {
	l.log.Warn(msg, keyvals...)
}

func (l *Logger) Error(msg string, keyvals ...interface{}) {
	l.log.Error(msg, keyvals...)
}

func (l *Logger) With(keyvals ...interface{}) log.Logger {
	newLogger := l.log.With(keyvals...)
	return &Logger{log: *newLogger}
}

func (l *Logger) Debugf(msg string, keyvals ...interface{}) {
	message := fmt.Sprintf(msg, keyvals...)
	l.log.Debug(message)
}

func (l *Logger) Errorf(msg string, keyvals ...interface{}) {
	message := fmt.Sprintf(msg, keyvals...)
	l.log.Error(message)
}

func (l *Logger) Infof(msg string, keyvals ...interface{}) {
	message := fmt.Sprintf(msg, keyvals...)
	l.log.Info(message)
}

func (l *Logger) Warningf(msg string, keyvals ...interface{}) {
	message := fmt.Sprintf(msg, keyvals...)
	l.log.Warn(message)
}

func (l *Logger) Fatalf(format string, v ...interface{}) {
	message := fmt.Sprintf(format, v...)
	l.log.Error(message)
}

func (l *Logger) Printf(format string, v ...interface{}) {
	message := fmt.Sprintf(format, v...)
	l.log.Info(message)
}

var _ log.Logger = (*Logger)(nil)
