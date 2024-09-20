package conf

import (
	"bytes"
	"os"

	"gopkg.in/yaml.v2"
)

func ReadConfigFromFile(confFilePath string, configTarget interface{}) error {
	if _, err := os.Stat(confFilePath); err != nil {
		return err
	}

	yamlFile, err := os.ReadFile(confFilePath)
	if err != nil {
		return err
	}

	return ReadConfigFromBytes(yamlFile, configTarget)
}

func ReadConfigFromBytes(buf []byte, configTarget interface{}) error {
	if err := yaml.Unmarshal(buf, configTarget); err != nil {
		return err
	}
	return nil
}

func WriteConfigToFile(confFilePath string, config interface{}) error {
	yamlData, err := yaml.Marshal(config)
	if err != nil {
		return err
	}

	err = os.WriteFile(confFilePath, yamlData, 0644)
	if err != nil {
		return err
	}

	return nil
}

func StringifyConfig(config interface{}) (string, error) {
	buf := new(bytes.Buffer)
	if err := yaml.NewEncoder(buf).Encode(config); err != nil {
		return "", err
	}
	return buf.String(), nil
}
