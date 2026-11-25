#!/usr/bin/env bash
set -euo pipefail
PACKAGE="$1"
PACKAGE_REF=refs/heads/chrome-dino-packages
NAME="$(basename "$PACKAGE")"
[[ "$NAME" =~ ^chrome_dino@[0-9]+\.[0-9]+\.[0-9]+\.tgz$ ]]

INDEX_DIR="$(mktemp -d)"
trap 'rm -rf "$INDEX_DIR"' EXIT
export GIT_INDEX_FILE="$INDEX_DIR/index"
PARENT=()
if git ls-remote --exit-code --refs origin "$PACKAGE_REF" >/dev/null; then
  git fetch --no-tags origin "$PACKAGE_REF"
  PARENT=(-p "$(git rev-parse FETCH_HEAD)")
  git read-tree FETCH_HEAD
else
  git read-tree --empty
fi

BLOB="$(git hash-object -w "$PACKAGE")"
CHECKSUM="$(sha256sum "$PACKAGE" | cut -d' ' -f1)"
SUM_BLOB="$(printf '%s  %s\n' "$CHECKSUM" "$NAME" | git hash-object -w --stdin)"
git update-index --add --cacheinfo "100644,$BLOB,$NAME"
git update-index --add --cacheinfo "100644,$SUM_BLOB,$NAME.sha256"
TREE="$(git write-tree)"
if [ "${#PARENT[@]}" -ne 0 ] && [ "$TREE" = "$(git rev-parse 'FETCH_HEAD^{tree}')" ]; then
  exit 0
fi
COMMIT="$(git -c user.name='github-actions[bot]' -c user.email='41898282+github-actions[bot]@users.noreply.github.com' \
  commit-tree "$TREE" "${PARENT[@]}" -m "Publish $NAME")"
git push origin "$COMMIT:$PACKAGE_REF"
