package logger

import (
	"errors"
	"fmt"
	"log"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
)

/**
Simplistic logger for audius-d.
*/

var (
	fileLogger  *slog.Logger
	cliLogger   *slog.Logger
	cliLevelVar = slog.LevelVar{}
	logFilepath = filepath.Join(os.TempDir(), "audius-d.log")

	cliHandlerOpts = slog.HandlerOptions{
		AddSource: false,
		Level:     &cliLevelVar,
		ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
			if a.Key == slog.MessageKey {
				return a
			} else { // Remove everything but the message
				return slog.Attr{}
			}
		},
	}
	logfileHandlerOpts = slog.HandlerOptions{
		AddSource: false,
		Level:     slog.LevelDebug,
	}
)

func init() {
	// configure loggers

	cliLogger = slog.New(
		NewCliHandler(slog.NewTextHandler(os.Stderr, &cliHandlerOpts)),
	)
	file, err := os.OpenFile(logFilepath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		log.Fatalf("Could not open log file '%s': %s", logFilepath, err.Error())
	}
	fileLogger = slog.New(slog.NewTextHandler(file, &logfileHandlerOpts))
}

func Info(msg string, v ...any) {
	fileLogger.Info(msg, v...)
	cliLogger.Info(msg, v...)
}

func Infof(format string, v ...any) {
	fmsg := fmt.Sprintf(format, v...)
	fileLogger.Info(fmsg)
	cliLogger.Info(fmsg)
}

func Debug(msg string, v ...any) {
	fileLogger.Debug(msg, v...)
	cliLogger.Debug(msg, v...)
}

func Debugf(format string, v ...any) {
	fmsg := fmt.Sprintf(format, v...)
	fileLogger.Debug(fmsg)
	cliLogger.Debug(fmsg)
}

func Warn(msg string, v ...any) {
	fileLogger.Warn(msg, v...)
	cliLogger.Warn(msg, v...)
}

func Warnf(format string, v ...any) {
	fmsg := fmt.Sprintf(format, v...)
	fileLogger.Warn(fmsg)
	cliLogger.Warn(fmsg)
}

func Errorf(format string, v ...any) error {
	emsg := fmt.Sprintf(format, v...)
	fileLogger.Error(emsg)
	cliLogger.Error(emsg)
	return errors.New(emsg)
}

// you can return this log as well
// to get log.Fatal effects
func Error(values ...any) error {
	messages := []string{}
	for _, v := range values {
		switch t := v.(type) {
		case string:
			messages = append(messages, t)
		case error:
			messages = append(messages, t.Error())
		default:
		}
	}
	message := strings.Join(messages, " ")
	fileLogger.Error(message)
	cliLogger.Error(message)
	return errors.New(message)
}

func GetLogFilepath() string {
	return logFilepath
}

func SetCliLogLevel(l slog.Level) {
	cliLevelVar.Set(l)
}
