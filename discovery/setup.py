# Setup.py allows audius-discovery as a redistributable package
# Currently, the repository is not configured as such but may be moving forward
# https://caremad.io/posts/2013/07/setup-vs-requirement/
import uuid

from pip._internal.req import parse_requirements
from setuptools import find_packages, setup

install_reqs = parse_requirements("requirements.txt", session=uuid.uuid1())  # type: ignore
requirements = [str(ir.requirement) for ir in install_reqs]

config = {
    "description": "Audius Discovery Provider",
    "author": "Hareesh Nagaraj",
    "url": "",
    "download_url": "",
    "author_email": "",
    "version": "0.1",
    "install_requires": requirements,
    "packages": find_packages(),
    "scripts": [],
    "name": "audius_discovery_provider",
}

setup(**config)
