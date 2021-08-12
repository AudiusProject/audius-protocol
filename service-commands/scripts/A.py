import subprocess
import argparse


def create_instance(name, image_project, image_family, size, machine_type):
    subprocess.run(
        [
            "gcloud",
            "compute",
            "instances",
            "create",
            name,
            "--image-project",
            image_project,
            "--image-family",
            image_family,
            "--boot-disk-size",
            size,
            "--machine-type",
            machine_type,
        ]
    )

    ip = (
        subprocess.run(
            [
                "gcloud",
                "compute",
                "instances",
                "describe",
                name,
                "--format",
                "get(networkInterfaces[0].accessConfigs[0].natIP)",
            ],
            capture_output=True,
        )
        .stdout.decode()
        .strip()
    )
    print("IP address:", ip)

    return ip


def setup(name, service, config, user):
    proc = subprocess.run(
        [
            "gcloud",
            "compute",
            "instances",
            "describe",
            name,
            "--format",
            "get(networkInterfaces[0].accessConfigs[0].natIP)",
        ],
        capture_output=True,
    )

    host = proc.stdout.decode().strip()
    if proc.returncode != 0:
        host = create_instance(
            name, "ubuntu-os-cloud", "ubuntu-2004-lts", "100", "n2-standard-4"
        )

    host = f"{user}@{host}"

    if service in ["creator-node", "discovery-provider"]:
        print("Setting up audius-k8s-manifests...")
        subprocess.run(
            [
                "ssh",
                host,
                (
                    "git clone https://github.com/AudiusProject/audius-k8s-manifests.git && "
                    "cd audius-k8s-manifests && "
                    "yes | sh setup.sh "
                ),
            ]
        )

        print("Waiting for instance to restart")
        returncode = None
        while returncode != 0:
            returncode = subprocess.run(["ssh", host, ":"])

        if config:
            print("Copying config...")
            subprocess.run(
                ["ssh", host, "cat > $MANIFESTS_PATH/config.yaml"],
                input=open(config).read(),
            )
        else:
            print("Warning no config specified")

    if service == "creator-node":
        print("Starting creator-node...")
        subprocess.run(
            [
                "ssh",
                host,
                "audius-cli launch creator-node --configure-ipfs",
            ]
        )
    elif service == "discovery-provider":
        print("Starting discovery-provider...")
        subprocess.run(
            [
                "ssh",
                host,
                "audius-cli launch discovery --seed-job --configure-ipfs",
            ]
        )
    elif service == "remote-dev":
        subprocess.run(
            [
                "ssh",
                host,
                (
                    "sudo apt update && "
                    "sudo apt install apt-transport-https ca-certificates curl software-properties-common build-essential python-is-python2 git-secrets && "
                    "curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add - && "
                    "sudo sudo add-apt-repository 'deb [arch=amd64] https://download.docker.com/linux/ubuntu focal stable' && "
                    "sudo apt update && "
                    "sudo apt install docker-ce && "
                    "sudo usermod -aG docker $USER && "
                    'sudo curl -L "https://github.com/docker/compose/releases/download/1.27.4/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && '
                    "sudo chmod +x /usr/local/bin/docker-compose && "
                    "sudo chown $USER /etc/hosts && "
                    "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash && "
                    "echo 'export PROTOCOL_DIR=$HOME/audius-protocol' >> ~/.profile && "
                    "source ~/.nvm/nvm.sh && "
                    "source ~/.profile && "
                    "source ~/.bashrc && "
                    "nvm install 10.23.0 && "
                    "git clone https://github.com/AudiusProject/audius-protocol.git; "
                    "git clone https://github.com/AudiusProject/audius-client.git; "
                    "cd audius-protocol/service-commands && "
                    "npm install && "
                    "node scripts/hosts.js add && "
                    "node scripts/setup.js run init-repos up && "
                    "cd ../libs && "
                    "npm link && "
                    "cd ../service-commands && "
                    "npm link @audius/libs && "
                    "cd ~/audius-client && "
                    "npm install && "
                    "npm link @audius/libs && "
                    "echo 'Rebooting machine...' && "
                    "reboot"
                ),
            ]
        )


def main():
    parser = argparse.ArgumentParser(
        description="",  # TODO
    )

    subparser = parser.add_subparsers(
        title="operations",
        dest="operation",
        required=True,
    )

    parser_create_instance = subparser.add_parser(
        "create-instance",
        help="Create instance on GCP with specified options",
    )

    parser_create_instance.add_argument(
        "--image-family",
        default="ubuntu-2004-lts",
        help="Image to use for creating the instance",
    )

    parser_create_instance.add_argument(
        "--image-project",
        default="ubuntu-os-cloud",
        help="Image project to fetch image from",
    )

    parser_create_instance.add_argument(
        "--size",
        default="100",
        help="Size of disk to create",
    )

    parser_create_instance.add_argument(
        "--machine-type",
        default="n2-standard-4",
        help="Machine type to use for the instance",
    )

    parser_create_instance.add_argument(
        "name",
        help="Name of instance to create",
    )

    parser_setup = subparser.add_parser(
        "setup",
        help="",  # TODO
    )

    parser_setup.add_argument(
        "--config",
        help="path to config",
    )

    parser_setup.add_argument(
        "--user",
        default="ubuntu",
        help="user to login as",
    )

    parser_setup.add_argument(
        "service",
        choices=["creator-node", "discovery-provider", "remote-dev"],
        help="",  # TODO
    )

    parser_setup.add_argument(
        "name",
        nargs="?",
        help="name of gcp instance to do setup on",
    )

    args = parser.parse_args()

    if args.operation == "create-instance":
        create_instance(
            args.name,
            args.image_project,
            args.image_family,
            args.size,
            args.machine_type,
        )
    elif args.operation == "setup":
        setup(args.name, args.service, args.config, args.user)


if __name__ == "__main__":
    main()
