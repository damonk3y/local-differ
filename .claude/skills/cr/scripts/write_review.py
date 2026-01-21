#!/usr/bin/env python3
"""
Write code review comments to a JSON file compatible with Local Differ.

Usage:
    write_review.py <output_path> <json_comments>

The json_comments argument should be a JSON string with this structure:
{
  "comments": [
    {
      "filePath": "src/example.ts",
      "staged": false,
      "generalComment": "Optional file-level comment",
      "lineComments": [
        {
          "startLine": 10,
          "endLine": 10,
          "side": "new",
          "text": "Review comment text",
          "lineContent": "const x = 1;"
        }
      ]
    }
  ]
}
"""

import json
import sys
import time
import random
import string


def generate_id():
    """Generate a random 7-character ID matching Local Differ's format."""
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=7))


def main():
    if len(sys.argv) < 3:
        print("Usage: write_review.py <output_path> <json_comments>")
        print("  output_path: Path to write the review JSON file")
        print("  json_comments: JSON string with review comments")
        sys.exit(1)

    output_path = sys.argv[1]
    json_input = sys.argv[2]

    try:
        data = json.loads(json_input)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        sys.exit(1)

    now = int(time.time() * 1000)

    # Build the output structure matching Local Differ's StoredComments format
    output = {
        "version": 2,
        "source": "claude-code-review",
        "comments": {},
        "lastModified": now
    }

    for file_comment in data.get("comments", []):
        file_path = file_comment.get("filePath", "")
        staged = file_comment.get("staged", False)
        key = f"{file_path}:{staged}"

        line_comments = []
        for lc in file_comment.get("lineComments", []):
            line_content = lc.get("lineContent", "")
            line_comments.append({
                "id": generate_id(),
                "startLine": lc.get("startLine", 1),
                "endLine": lc.get("endLine", lc.get("startLine", 1)),
                "lineContent": line_content,
                "lineContents": lc.get("lineContents", [line_content]),
                "side": lc.get("side", "new"),
                "text": lc.get("text", ""),
                "createdAt": now,
                "updatedAt": now
            })

        output["comments"][key] = {
            "filePath": file_path,
            "staged": staged,
            "generalComment": file_comment.get("generalComment", ""),
            "lineComments": line_comments
        }

    # Write the output file
    with open(output_path, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"Review written to {output_path}")
    print(f"Total files: {len(output['comments'])}")
    total_comments = sum(
        len(fc['lineComments']) + (1 if fc['generalComment'] else 0)
        for fc in output['comments'].values()
    )
    print(f"Total comments: {total_comments}")


if __name__ == "__main__":
    main()
