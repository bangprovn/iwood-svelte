#!/usr/bin/env bash
# Bulk-uploads every file under static/uploads/<rel> to the R2 bucket as
# `uploads/<rel>`, preserving paths so that
#   https://cdn.iwood.com.vn/uploads/<rel>
# resolves once cdn.iwood.com.vn is bound to the bucket.
#
# Auth comes from `npx wrangler login`. No R2 API tokens required for the
# one-off bulk import — for automated runs from CI, prefer
# scripts/mirror-uploads-to-s3.mjs with S3_* env vars.
#
# Env:
#   BUCKET    R2 bucket name (default: iwood-cdn)
#   ROOT      source directory (default: repo's static/uploads)
#   LOGFILE   per-file outcome log (default: dumps/r2-upload.log)
#   PARALLEL  concurrent uploads (default: 16)

set -u

BUCKET=${BUCKET:-iwood-cdn}
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HERE/.." && pwd)"
ROOT=${ROOT:-"$REPO_ROOT/static/uploads"}
LOGFILE=${LOGFILE:-"$REPO_ROOT/dumps/r2-upload.log"}
PARALLEL=${PARALLEL:-16}

mkdir -p "$(dirname "$LOGFILE")"
: > "$LOGFILE"

ct_for() {
	local lower="${1##*.}"
	lower="$(printf '%s' "$lower" | tr '[:upper:]' '[:lower:]')"
	case "$lower" in
		jpg|jpeg) echo image/jpeg ;;
		png) echo image/png ;;
		webp) echo image/webp ;;
		gif) echo image/gif ;;
		svg) echo image/svg+xml ;;
		avif) echo image/avif ;;
		pdf) echo application/pdf ;;
		*) echo application/octet-stream ;;
	esac
}

WRANGLER="$REPO_ROOT/node_modules/.bin/wrangler"
if [ ! -x "$WRANGLER" ]; then
	echo "wrangler not found at $WRANGLER — run 'npm install' first" >&2
	exit 1
fi

upload_one() {
	local path="$1"
	local rel="${path#./}"
	local ct
	ct="$(ct_for "$rel")"
	local key="uploads/$rel"
	if "$WRANGLER" r2 object put "$BUCKET/$key" --file="$path" --content-type="$ct" --remote >/dev/null 2>&1; then
		printf 'OK  %s\n' "$key" >> "$LOGFILE"
	else
		printf 'ERR %s\n' "$key" >> "$LOGFILE"
	fi
}

export -f ct_for upload_one
export BUCKET LOGFILE WRANGLER

total=$(find "$ROOT" -type f | wc -l | tr -d ' ')
echo "Uploading $total files from $ROOT to r2://$BUCKET/uploads/ with PARALLEL=$PARALLEL"
echo "Log: $LOGFILE"

cd "$ROOT" || exit 1
find . -type f -print0 | xargs -0 -n1 -P"$PARALLEL" -I{} bash -c 'upload_one "$1"' _ {}

ok=$(grep -c '^OK ' "$LOGFILE" || true)
err=$(grep -c '^ERR ' "$LOGFILE" || true)
echo "Done. ok=$ok err=$err total=$total"
