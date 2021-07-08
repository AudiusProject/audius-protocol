# TODO: Add DocString
import logging
import configparser
import os
import os.path

import datetime

from flask import current_app

logger = logging.getLogger(__name__)

config_files = []
if os.path.isfile("default_config.ini"):
    config_files.append("default_config.ini")
if os.path.isfile("contract_config.ini"):
    config_files.append("contract_config.ini")
if "LOCAL_CONFIG" in os.environ and os.path.isfile(os.environ["LOCAL_CONFIG"]):
    config_files.append(os.environ["LOCAL_CONFIG"])

if "default_config.ini" not in config_files:
    raise RuntimeError("Missing required configuration: default_config.ini")

if not config_files:
    raise RuntimeError(
        "No valid configuration file found. Please set the "
        "LOCAL_CONFIG envvar or run the app from the correct "
        "directory."
    )


def env_config_update(config, section_name, key):
    env_var_base = f"{section_name}_{key}"
    env_var_name = f"audius_{env_var_base}"
    env_var_value = os.environ.get(env_var_name)
    env_var_exists = env_var_value != None
    logger.error(f"{env_var_name} : Exists? {env_var_exists}")
    if env_var_exists:
        # Override any config values with environment variables if present
        # Variables are formatted as audius_<section_name>_<key>
        config[section_name][key] = env_var_value


class ConfigIni(configparser.ConfigParser):  # pylint: disable=too-many-ancestors
    """Subclass of ConfigParser.ConfigParser that must be run inside a
    flask app context. It looks for a special [flask] section of the config
    file and uses that to configure flask's own built-in variables."""

    def read(self, filenames, encoding=None):
        """Overridden read() method to call parse_flask_section() at the end"""
        ret = configparser.ConfigParser.read(self, filenames, encoding)
        self.parse_flask_section()
        return ret

    def parse_flask_section(self):
        """Parse the [flask] section of your config and hand off the config
        to the app in context.

        Config vars should have the same name as their flask equivalent except
        in all lower-case."""
        for section_name in self.sections():
            current_app.config[section_name] = {}

        for section_name in self.sections():
            for item in self.items(section_name):
                self._load_item(section_name, item[0])

        # Set db_read_replica url to same as db url if none provided
        if ("url_read_replica" not in current_app.config["db"]) or (
            not current_app.config["db"]["url_read_replica"]
        ):
            current_app.config["db"]["url_read_replica"] = current_app.config["db"][
                "url"
            ]

        # Always disable (not included in app.default_config)
        # See https://flask-restx.readthedocs.io/en/latest/mask.html#usage
        current_app.config["RESTX_MASK_SWAGGER"] = False

    def _load_item(self, section_name, key):
        """Load the specified item from the [flask] section. Type is
        determined by the type of the equivalent value in app.default_config
        or string if unknown."""
        default = current_app.default_config.get(key)
        if isinstance(default, datetime.timedelta):
            # One of the default config vars is a timedelta - interpret it
            # as an int and construct using it
            current_app.config[section_name][key] = datetime.timedelta(
                self.getint(section_name, key)
            )
        elif isinstance(default, bool):
            current_app.config[section_name][key] = self.getboolean(section_name, key)
        elif isinstance(default, float):
            current_app.config[section_name][key] = self.getfloat(section_name, key)
        elif isinstance(default, int):
            current_app.config[section_name][key] = self.getint(section_name, key)
        else:
            # All the string keys need to be coerced into str()
            # because Flask expects some of them not to be unicode
            current_app.config[section_name][key] = str(self.get(section_name, key))
        env_config_update(current_app.config, section_name, key)


shared_config = configparser.ConfigParser()
shared_config.read(config_files)

# Set up section-specific dictionaries for convenient access (i.e.
# config.section_name['VAR_NAME'])
for section in shared_config.sections():
    for static_item in shared_config.items(section):
        static_key = static_item[0]
        env_config_update(shared_config, section, static_key)

try:
    owner_wallet = shared_config["delegate"]["owner_wallet"]
    private_key = shared_config["delegate"]["private_key"]

    if not owner_wallet or not private_key:
        raise RuntimeError()

except (KeyError, RuntimeError) as e:
    raise RuntimeError(
        f"""
    Missing delegate owner wallet ({owner_wallet}) and/or delgate private key ({private_key}): {e}
    """
    ) from e
