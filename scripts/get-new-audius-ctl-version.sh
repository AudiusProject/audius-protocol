# This script should be run from the Makefile only.
set -eo pipefail

auth_temp="$(mktemp)"
if ! gh auth status &> "$auth_temp"; then
    cat "$auth_temp" 1>&2
    echo "Please authenticate with the github cli for proper versioning." 1>&2
    exit 1
fi
rm "$auth_temp"

upgrade="$1"

case $upgrade in
    major) awk_script='{$1 = $1 + 1;$2 = 0; $3 = 0;} 1'
    ;;
    minor) awk_script='{$2 = $2 + 1; $3 = 0;} 1'
    ;;
    *) awk_script='{$3 = $3 + 1;} 1'
esac

# TODO: remove after first release in monorepo
echo 0.1.0
exit 0

new_version=$(\
    gh release view --json tagName | \
    jq -r ".tagName" | \
    cut -d@ -f2 | \
    awk -F. "$awk_script" | \
    sed 's/ /./g' \
)

echo $new_version
