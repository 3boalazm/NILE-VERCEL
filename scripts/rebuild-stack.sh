#!/usr/bin/env bash
# Historical entry point, kept so old notes keep working. The stack bootstrap
# moved to scripts/setup-local-stack.sh (two databases, Vendure migrations from
# the repo, idempotent provisioning + audit). See docs/OPS.md §11.
exec bash "$(dirname "$0")/setup-local-stack.sh" "$@"
