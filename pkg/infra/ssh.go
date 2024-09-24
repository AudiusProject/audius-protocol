package infra

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"golang.org/x/crypto/ssh"
)

func setupSSHClient(privateKeyPath, publicIP string) (*ssh.Client, error) {
	key, err := os.ReadFile(privateKeyPath)
	if err != nil {
		return nil, fmt.Errorf("unable to read private key: %v", err)
	}

	signer, err := ssh.ParsePrivateKey(key)
	if err != nil {
		return nil, fmt.Errorf("unable to parse private key: %v", err)
	}

	config := &ssh.ClientConfig{
		User:            "ubuntu",
		Auth:            []ssh.AuthMethod{ssh.PublicKeys(signer)},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
		Timeout:         10 * time.Second,
	}

	client, err := ssh.Dial("tcp", publicIP+":22", config)
	if err != nil {
		return nil, fmt.Errorf("failed to dial: %v", err)
	}

	return client, nil
}

func executeSSHCommand(privateKeyPath, publicIP, command string) (string, error) {
	client, err := setupSSHClient(privateKeyPath, publicIP)
	if err != nil {
		return "", err
	}
	defer client.Close()

	session, err := client.NewSession()
	if err != nil {
		return "", fmt.Errorf("failed to create session: %v", err)
	}
	defer session.Close()

	out, err := session.CombinedOutput(command)
	if err != nil {
		return "", fmt.Errorf("failed to execute command: %v", err)
	}

	return string(out), nil
}

func updateSSHConfig(hostname, identityFile, ip string) error {
	// TODO: `~/.ssh/config_personal` should not be hardcoded here - make more robust
	configPath := filepath.Join(os.Getenv("HOME"), ".ssh", "config_personal")

	updated, err := processSSHConfig(configPath, hostname, identityFile, ip)
	if err != nil {
		return fmt.Errorf("unable to process %s: %v", configPath, err)
	}

	if updated {
		fmt.Println("SSH config updated successfully.")
		err = addHostKeyToKnownHosts(ip)
		if err != nil {
			return fmt.Errorf("unable to add key to known_hosts: %v", err)
		}
	} else {
		fmt.Println("No updates made to SSH config.")
	}
	fmt.Println("Updated file:", configPath)

	return nil
}

func processSSHConfig(configPath, hostname, identityFile, ip string) (bool, error) {
	contents, err := os.ReadFile(configPath)
	if err != nil {
		return false, err
	}

	lines := strings.Split(string(contents), "\n")
	exists, updatedLines := updateExistingHost(lines, hostname, identityFile, ip)

	if !exists {
		updatedLines = appendNewHost(lines, hostname, identityFile, ip)
	}

	return true, os.WriteFile(configPath, []byte(strings.Join(updatedLines, "\n")), 0644)
}

func updateExistingHost(lines []string, hostname, identityFile, ip string) (bool, []string) {
	var updatedLines []string
	exists := false
	inHostBlock := false
	for _, line := range lines {
		if strings.HasPrefix(line, "Host "+hostname) {
			exists = true
			inHostBlock = true
		} else if inHostBlock && strings.HasPrefix(line, "Host ") {
			inHostBlock = false
		}

		if inHostBlock {
			if strings.HasPrefix(line, "  IdentityFile ") {
				line = "  IdentityFile " + identityFile
				inHostBlock = false // Exit the block after updating relevant fields
			} else if strings.HasPrefix(line, "  HostName ") {
				line = "  HostName " + ip
				inHostBlock = false // Exit the block after updating relevant fields
			}
		}

		updatedLines = append(updatedLines, line)
	}
	return exists, updatedLines
}

func appendNewHost(lines []string, hostname, identityFile, ip string) []string {
	newHostEntry := fmt.Sprintf("\nHost %s\n  IdentityFile %s\n  HostName %s\n  User ubuntu\n  IdentitiesOnly yes\n", hostname, identityFile, ip)
	return append(lines, newHostEntry)
}

func addHostKeyToKnownHosts(publicIP string) error {
	cmd := exec.Command("ssh-keyscan", "-H", publicIP)
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("ssh-keyscan failed: %v", err)
	}

	knownHostsCmd := exec.Command("sh", "-c", fmt.Sprintf("echo '%s' >> ~/.ssh/known_hosts", string(output)))
	if err := knownHostsCmd.Run(); err != nil {
		return fmt.Errorf("failed to add host key to known_hosts: %v", err)
	}

	return nil
}
