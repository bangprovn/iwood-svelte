#!/usr/bin/env bash
# Re-uploads the ERR entries from dumps/r2-upload.log, with exponential backoff
# on 429 (R2 rate-limited the initial bulk run at 24 parallel — Cloudflare's
# bucket-write QPS cap kicks in well below that).
#
# Idempotent: rewrites dumps/r2-upload.log in place — successful retries flip
# their entry from ERR -> OK so re-runs only target the still-failing set.
#
# Env:
#   BUCKET    R2 bucket name (default: iwood-cdn)
#   PARALLEL  concurrent retries (default: 4)
#   MAX_TRIES per-file attempts (default: 6)

set -u

BUCKET=${BUCKET:-iwood-cdn}
PARALLEL=${PARALLEL:-4}
MAX_TRIES=${MAX_TRIES:-6}
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HERE/.." && pwd)"
ROOT="$REPO_ROOT/static/uploads"
LOGFILE="$REPO_ROOT/dumps/r2-upload.log"
RETRYLOG="$REPO_ROOT/dumps/r2-retry.log"
WRANGLER="$REPO_ROOT/node_modules/.bin/wrangler"

if [ ! -x "$WRANGLER" ]; then
	echo "wrangler not found at $WRANGLER — run 'npm install' first" >&2
	exit 1
fi
if [ ! -f "$LOGFILE" ]; then
	echo "No prior upload log at $LOGFILE — run upload-uploads-to-r2.sh first" >&2
	exit 1
fi

: > "$RETRYLOG"

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

retry_one() {
	local key="$1"
	local rel="${key#uploads/}"
	local path="$ROOT/$rel"
	local ct
	ct="$(ct_for "$rel")"

	if [ ! -f "$path" ]; then
		printf 'MISSING %s\n' "$key" >> "$RETRYLOG"
		return
	fi

	local attempt=1
	local delay=2
	while [ "$attempt" -le "$MAX_TRIES" ]; do
		if "$WRANGLER" r2 object put "$BUCKET/$key" --file="$path" --content-type="$ct" --remote >/dev/null 2>&1; then
			printf 'OK %s\n' "$key" >> "$RETRYLOG"
			return
		fi
		# Backoff: 2, 4, 8, 16, 32, 64s. Jitter +0..delay/2.
		local jitter=$(( RANDOM % (delay / 2 + 1) ))
		sleep $(( delay + jitter ))
		delay=$(( delay * 2 ))
		attempt=$(( attempt + 1 ))
	done
	printf 'ERR %s\n' "$key" >> "$RETRYLOG"
}

export -f ct_for retry_one
export BUCKET WRANGLER ROOT RETRYLOG MAX_TRIES

failed_keys=$(grep '^ERR ' "$LOGFILE" | awk '{print $2}')
n=$(printf '%s\n' "$failed_keys" | grep -c . || true)
echo "Retrying $n failed uploads with PARALLEL=$PARALLEL MAX_TRIES=$MAX_TRIES"

printf '%s\n' "$failed_keys" | xargs -n1 -P"$PARALLEL" -I{} bash -c 'retry_one "$1"' _ {}

ok=$(grep -c '^OK ' "$RETRYLOG" || true)
err=$(grep -c '^ERR ' "$RETRYLOG" || true)
miss=$(grep -c '^MISSING ' "$RETRYLOG" || true)
echo "Retry pass done. ok=$ok err=$err missing=$miss"

# Fold retry successes back into the main log so subsequent reruns only target
# still-failing keys. Build a set of newly-OK keys and rewrite ERR -> OK lines.
if [ "$ok" -gt 0 ]; then
	tmp="$(mktemp)"
	awk 'NR==FNR { if ($1=="OK") ok[$2]=1; next }
	     { if ($1=="ERR" && ($2 in ok)) $1="OK"; print }' "$RETRYLOG" "$LOGFILE" > "$tmp"
	mv "$tmp" "$LOGFILE"
	echo "Merged retry results into $LOGFILE"
fi
