EXCLUDE_DIRS=(
    "core/db/sql"
    "core/infra/dev_config"
)

EXCLUDE_PATTERN=$(printf "|^%s" "${EXCLUDE_DIRS[@]}")
EXCLUDE_PATTERN=${EXCLUDE_PATTERN:1}

# scan the staged files
git diff --cached --name-only | grep -Ev "$EXCLUDE_PATTERN" | xargs git secrets --scan --cached
