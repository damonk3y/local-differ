---
name: cr
description: Comprehensive code review for local git changes. Analyzes security vulnerabilities, performance issues, bugs, best practices, and code style. Triggers on /cr command. Reviews unstaged and staged changes by default.
---

# Code Review

Review local git changes for security, performance, bugs, best practices, and style. Output a JSON file for import into Local Differ.

## Workflow

1. Reset `.claude/review.json` by writing an empty review: `{"comments":[]}`
2. Run `git diff` (unstaged) and `git diff --cached` (staged) to get changes
3. Analyze each changed file for issues
4. Build a JSON structure with findings (issues only - no positive comments)
5. Write to `.claude/review.json` using the `write_review.py` script
6. Display a summary to the user

## Review Categories

**Security**: Injection vulnerabilities, hardcoded secrets, insecure data handling, auth issues, OWASP Top 10

**Performance**: Inefficient algorithms, N+1 queries, memory leaks, missing caching, blocking operations

**Bugs**: Logic errors, null handling, race conditions, resource leaks, type mismatches

**Best Practices**: SOLID violations, code duplication, poor error handling, missing validation

**Style**: Naming conventions, unnecessary complexity, dead code, inconsistent patterns

## Severity Levels

- **[CRITICAL]**: Security vulnerabilities, data loss risks, breaking bugs - must fix
- **[WARNING]**: Performance issues, potential bugs, bad practices - should fix
- **[SUGGESTION]**: Style improvements, minor optimizations - nice to have

## Output JSON Structure

Build this structure and pass it to `write_review.py`:

```json
{
  "comments": [
    {
      "filePath": "src/example.ts",
      "staged": false,
      "lineComments": [
        {
          "startLine": 10,
          "endLine": 10,
          "side": "new",
          "text": "[CRITICAL] Security: SQL injection vulnerability. Use parameterized queries instead.",
          "lineContent": "db.query(`SELECT * FROM users WHERE id = ${id}`)"
        }
      ]
    }
  ]
}
```

Field notes:
- `staged`: true for staged changes (`git diff --cached`), false for unstaged (`git diff`)
- `side`: "new" for added/modified lines, "old" for removed lines
- `startLine`/`endLine`: Line numbers in the new file (or old file if side="old")
- `text`: Include severity prefix like `[CRITICAL]`, `[WARNING]`, or `[SUGGESTION]`

## Writing the Review File

After analysis, write the review using the script:

```bash
python3 .claude/skills/cr/scripts/write_review.py .claude/review.json '<JSON_STRING>'
```

The JSON string must be properly escaped for shell. For complex reviews, write a temp file first.

## Console Output

After writing the JSON, display a summary:

```
## Code Review Complete

**Files reviewed:** N
**Issues found:** X critical, Y warnings, Z suggestions

### Critical Issues
- path/file.ts:42 - Brief description

### Warnings
- path/file.ts:15 - Brief description

Review saved to `.claude/review.json`
```

If no issues found, simply output:

```
## Code Review Complete

**Files reviewed:** N
**No issues found.**
```

## Review Guidelines

- Only report issues - no positive comments or praise
- Focus on changed lines but consider surrounding context
- Prioritize actionable feedback over nitpicks
- Explain WHY something is problematic, not just what
- Provide concrete fix suggestions for critical issues
- If no issues found, output empty review and state "No issues found"
