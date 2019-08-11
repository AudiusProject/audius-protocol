from pylint import epylint as lint


def lint_directory(directory):
    # Execute lint
    print(f"Linting {directory}")
    (std_out, std_err) = lint.py_run(directory, return_std=True)
    passed_lint = "rated at 10.00" in std_out.getvalue()
    if not passed_lint:
        print(std_out.getvalue())
        print(std_err.getvalue())
        raise ValueError("FAILED LINT CHECK")


lint_directory("src/")
lint_directory("tests/")
