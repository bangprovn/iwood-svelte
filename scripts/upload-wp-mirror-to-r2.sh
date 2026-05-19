#!/usr/bin/env bash
# Uploads dumps/wp.sqlite to R2 so the Dockerfile can fetch it at build time
# via the WP_MIRROR_URL build arg. Refresh whenever you regenerate the mirror
# (`node scripts/wp-mirror.mjs`).
#
# Auth comes from `npx wrangler login`.
#
# Env:
#   BUCKET    R2 bucket name (default: iwood-cdn)
#   KEY       object key inside the bucket (default: seed/wp.sqlite)
#   FILE      local path to upload (default: dumps/wp.sqlite)
#   PRESIGN   if "1", emit a presigned URL valid for EXPIRES seconds
#   EXPIRES   presign lifetime in seconds (default: 3600)

set -euo pipefail

BUCKET=${BUCKET:-iwood-cdn}
KEY=${KEY:-seed/wp.sqlite}
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$HERE/.." && pwd)"
FILE=${FILE:-"$REPO_ROOT/dumps/wp.sqlite"}
PRESIGN=${PRESIGN:-0}
EXPIRES=${EXPIRES:-3600}

WRANGLER="$REPO_ROOT/node_modules/.bin/wrangler"
if [ ! -x "$WRANGLER" ]; then
	echo "wrangler not found at $WRANGLER — run 'npm install' first" >&2
	exit 1
fi
if [ ! -f "$FILE" ]; then
	echo "source file not found: $FILE" >&2
	exit 1
fi

echo "Uploading $FILE -> r2://$BUCKET/$KEY ($(wc -c < "$FILE") bytes)"
"$WRANGLER" r2 object put "$BUCKET/$KEY" \
	--file="$FILE" \
	--content-type="application/x-sqlite3" \
	--remote

if [ "$PRESIGN" = "1" ]; then
	echo "Presigned URL (expires in ${EXPIRES}s):"
	"$WRANGLER" r2 object get "$BUCKET/$KEY" --remote --pipe --presign --expires="$EXPIRES" 2>/dev/null || \
		echo "(presign not supported by this wrangler version — generate one via the R2 dashboard or S3 API)"
fi
