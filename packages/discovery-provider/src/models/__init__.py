import pkgutil

__path__ = pkgutil.extend_path(__path__, __name__)  # type: ignore
for imp, module, ispackage in pkgutil.walk_packages(
    path=__path__, prefix=__name__ + "."
):
    __import__(module)
