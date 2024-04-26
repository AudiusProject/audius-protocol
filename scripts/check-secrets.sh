# scan the staged files
git secrets --scan --cached $(git diff --cached --name-only)
