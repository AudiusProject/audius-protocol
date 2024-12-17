package sdk

import "time"

type SdkOption func(*Sdk)

func NewSdk(opts ...SdkOption) (*Sdk, error) {
	s := defaultSdk()
	for _, opt := range opts {
		opt(s)
	}
	if err := initSdk(s); err != nil {
		return nil, err
	}
	return s, nil
}
func WithLogger(logger Logger) SdkOption {
	return func(s *Sdk) {
		s.logger = logger
	}
}

func WithUsehttps(useHttps bool) SdkOption {
	return func(s *Sdk) {
		s.useHttps = useHttps
	}
}

func WithPrivkey(privKey string) SdkOption {
	return func(s *Sdk) {
		s.privKey = privKey
	}
}

func WithOapiendpoint(OAPIEndpoint string) SdkOption {
	return func(s *Sdk) {
		s.OAPIEndpoint = OAPIEndpoint
	}
}

func WithGrpcendpoint(GRPCEndpoint string) SdkOption {
	return func(s *Sdk) {
		s.GRPCEndpoint = GRPCEndpoint
	}
}

func WithJrpcendpoint(JRPCEndpoint string) SdkOption {
	return func(s *Sdk) {
		s.JRPCEndpoint = JRPCEndpoint
	}
}

func WithRetries(retries int) SdkOption {
	return func(s *Sdk) {
		s.retries = retries
	}
}

func WithDelay(delay time.Duration) SdkOption {
	return func(s *Sdk) {
		s.delay = delay
	}
}
