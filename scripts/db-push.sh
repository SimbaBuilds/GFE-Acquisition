#!/usr/bin/env bash
# Pre-flight check before `supabase db push` to prevent pushing to the wrong project.
# History: on 2026-04-24 the gfe-acquisition link was accidentally set to the SKMD
# clinical-platform ref. A naive push would have written to the wrong prod DB.
set -euo pipefail

EXPECTED="upcflyzbkztkuztqiswh"  # gfe-acquisition
ACTUAL=$(cat supabase/.temp/project-ref 2>/dev/null || echo "none")

if [[ "$ACTUAL" != "$EXPECTED" ]]; then
  echo "ERROR: Supabase CLI is linked to '$ACTUAL', expected '$EXPECTED' (gfe-acquisition)."
  echo "Re-link before pushing:"
  echo "  cd gfe-acquisition && supabase link --project-ref $EXPECTED"
  exit 1
fi

echo "Link OK ($ACTUAL = gfe-acquisition). Running supabase db push..."
exec supabase db push "$@"
