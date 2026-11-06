#!/usr/bin/env bash
# SessionStart hook: בודק שהפרויקט של רחלי מוגדר לחשבון GitHub הנכון,
# ומבקש מ-Claude לאשר את החשבון עם המשתמש בתחילת השיחה.
EXPECTED="racheladirWeb"
FORBIDDEN="adir-shlomi"

cd "$(dirname "$0")/../.." || exit 0

name=$(git config --local user.name 2>/dev/null)
remote=$(git remote get-url origin 2>/dev/null)

status="OK"
problems=""
[ "$name" != "$EXPECTED" ] && { status="MISMATCH"; problems="$problems git user.name='$name' (expected $EXPECTED);"; }
case "$remote" in
  *"$EXPECTED"@github.com/"$EXPECTED"/*) ;;
  *) status="MISMATCH"; problems="$problems origin='$remote' (expected https://$EXPECTED@github.com/$EXPECTED/...);" ;;
esac
case "$name $remote" in *"$FORBIDDEN"*) status="FORBIDDEN"; problems="$problems uses $FORBIDDEN (Shlomi's site account);" ;; esac

if [ "$status" = "OK" ]; then
  ctx="GitHub account check: OK. Project rachel-web is set to account $EXPECTED (git user.name=$name, origin=$remote). At the start of this conversation, tell the user in one short Hebrew line that the project is on GitHub account $EXPECTED and ask them to confirm before any git push or gh command. Never use $FORBIDDEN here."
  msg="GitHub: racheladirWeb ✓"
else
  ctx="GitHub account check: $status —$problems Do NOT push or run gh commands. Tell the user in Hebrew at the start of the conversation exactly what is wrong and fix it only after they confirm. Never use $FORBIDDEN in this project."
  msg="⚠ GitHub account check failed: $status"
fi

# JSON-escape quotes/backslashes
esc() { printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'; }
printf '{"systemMessage":"%s","hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"%s"}}\n' "$(esc "$msg")" "$(esc "$ctx")"
