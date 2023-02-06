package config

type Config struct {
	WebServerPort              string
	DatabaseAddress            string
	DatabaseUsername           string
	DatabasePassword           string
	DatabaseName               string
	Debug                      bool
	ClickHouseMaxExecutionTime uint64
}

// TODO: pull a config from a .env or some other file
func DefaultConfig() *Config {
	return &Config{
		WebServerPort:              ":8927",
		DatabaseAddress:            "127.0.0.1:9000",
		DatabaseUsername:           "default",
		DatabasePassword:           "",
		DatabaseName:               "default",
		Debug:                      true,
		ClickHouseMaxExecutionTime: 60,
	}
}
