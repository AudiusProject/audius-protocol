package config

type Config struct {
	Debug bool

	// echo config
	TrendingEchoPort string
	HideBanner       bool

	// clickhouse config
	DatabaseAddress  string
	DatabaseUsername string
	DatabasePassword string
	DatabaseName     string
	MaxExecutionTime uint64
}

// TODO: read from a .env file
// https://linear.app/audius/issue/PLAT-682/[trending-server]-read-config-from-env-file
func Default() (*Config, error) {
	return &Config{
		TrendingEchoPort: "9876",
		Debug:            true,
		HideBanner:       false,
		DatabaseAddress:  "127.0.0.1:9000",
		DatabaseUsername: "default",
		DatabasePassword: "",
		DatabaseName:     "default",
		MaxExecutionTime: 60,
	}, nil
}

func TestDefault() (*Config, error) {
	return &Config{
		TrendingEchoPort: "9876",
		Debug:            true,
		HideBanner:       true,
		DatabaseAddress:  "127.0.0.1:9000",
		DatabaseUsername: "default",
		DatabasePassword: "",
		DatabaseName:     "default",
		MaxExecutionTime: 60,
	}, nil
}

// Echo requires the ':' so thought i'd put a helper here
func (conf *Config) FormatEchoPort() string {
	return ":" + conf.TrendingEchoPort
}
