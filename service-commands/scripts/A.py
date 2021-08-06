import subprocess
import argparse


def create_instance(name, image, machine_type):
    subprocess.run(
        [
            "gcloud",
            "compute",
            "instances",
            "create",
            name,
            "--image",
            image,
            "--machine-type",
            machine_type,
        ]
    )


def setup(host, service, config):
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

    if serivce == "creator-node":
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
                f"audius-cli launch discovery {'--seed-job' if seed_job else ''} --configure-ipfs",
            ]
        )
    elif service == "remote-dev":
        subprocess.run(
            [
                "ssh",
                host,
                (
                    "git clone https://github.com/AudiusProject/audius-protocol.git && "
                    "cd audius-protocol"
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
        "--image",
        default="ubuntu-2004-lts",
        help="Image to use for creating the instance",
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
        "host",
        help="Host to do setup on",
    )

    parser_setup.add_argument(
        "service",
        choices=["creator-node", "discovery-provider", "remote-dev"],
        help="",  # TODO
    )

    args = parser.parse_args()

    if args.operation == "create-instance":
        create_instance(args.name, args.image, args.machine_type)
    elif args.operation == "setup":
        setup(args.host, args.service, args.config)


if __name__ == "__main__":
    main()
