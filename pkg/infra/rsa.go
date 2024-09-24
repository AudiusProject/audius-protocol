package infra

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"os"
	"path/filepath"

	"golang.org/x/crypto/ssh"
)

func ensureRSAKeyPair(baseDir, instanceName string) (privateKeyFilePath, publicKeyPem string, err error) {
	keyDir := filepath.Join(baseDir, ".pulumi", ".ssh")
	if err = os.MkdirAll(keyDir, 0700); err != nil {
		return "", "", fmt.Errorf("unable to create key directory: %w", err)
	}

	privateKeyFilePath = filepath.Join(keyDir, fmt.Sprintf("%s_rsa", instanceName))

	if _, err = os.Stat(privateKeyFilePath); os.IsNotExist(err) {
		privateKeyFilePath, publicKeyPem, err = generateRSAKey(instanceName, keyDir)
		if err != nil {
			return "", "", fmt.Errorf("unable to generate RSA key: %w", err)
		}
	} else if err != nil {
		return "", "", fmt.Errorf("error checking private key file: %w", err)
	} else {
		publicKeyPem, err = readPublicKeyFromPrivateKey(privateKeyFilePath)
		if err != nil {
			return "", "", fmt.Errorf("unable to read public key from private key: %w", err)
		}
	}

	return privateKeyFilePath, publicKeyPem, nil
}

func generateRSAKey(instanceName, keyDir string) (privateKeyFilePath, publicKeyPem string, err error) {
	privateKey, err := rsa.GenerateKey(rand.Reader, 4096)
	if err != nil {
		return "", "", fmt.Errorf("unable to generate private key: %w", err)
	}

	sshPublicKey, err := ssh.NewPublicKey(&privateKey.PublicKey)
	if err != nil {
		return "", "", fmt.Errorf("unable to create SSH public key: %w", err)
	}
	publicKeyBytes := ssh.MarshalAuthorizedKey(sshPublicKey)
	publicKeyPem = string(publicKeyBytes)

	privateKeyFilePath = filepath.Join(keyDir, fmt.Sprintf("%s_rsa", instanceName))

	privateFile, err := os.Create(privateKeyFilePath)
	if err != nil {
		return "", "", fmt.Errorf("unable to create private key file: %w", err)
	}
	defer privateFile.Close()

	if err := os.Chmod(privateKeyFilePath, 0400); err != nil {
		return "", "", fmt.Errorf("unable to set private key file permissions: %w", err)
	}

	privatePem := pem.EncodeToMemory(&pem.Block{
		Type:  "RSA PRIVATE KEY",
		Bytes: x509.MarshalPKCS1PrivateKey(privateKey),
	})

	_, err = privateFile.Write(privatePem)
	if err != nil {
		return "", "", fmt.Errorf("unable to write private key file: %w", err)
	}

	return privateKeyFilePath, publicKeyPem, nil
}

func readPublicKeyFromPrivateKey(privateKeyFilePath string) (publicKeyPem string, err error) {
	privateKeyBytes, err := os.ReadFile(privateKeyFilePath)
	if err != nil {
		return "", fmt.Errorf("unable to read existing private key: %w", err)
	}

	privateKeyBlock, _ := pem.Decode(privateKeyBytes)
	if privateKeyBlock == nil {
		return "", fmt.Errorf("failed to parse PEM block containing the key")
	}

	privateKey, err := x509.ParsePKCS1PrivateKey(privateKeyBlock.Bytes)
	if err != nil {
		return "", fmt.Errorf("unable to parse private key: %w", err)
	}

	sshPublicKey, err := ssh.NewPublicKey(&privateKey.PublicKey)
	if err != nil {
		return "", fmt.Errorf("unable to create SSH public key from existing private key: %w", err)
	}
	publicKeyBytes := ssh.MarshalAuthorizedKey(sshPublicKey)
	return string(publicKeyBytes), nil
}
