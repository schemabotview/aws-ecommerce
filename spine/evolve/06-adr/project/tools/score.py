"""Score a decision record:  python -m tools.score docs/adr/001-x.md

Reads the record's two tables: an option failing a MUST is out; the rest are
ranked by their WANTS, each score times its weight. The record is the source:
change a score there, and the ranking follows."""
import sys


def table(lines: list[str], heading: str) -> list[list[str]]:
    """The rows of the first table after the line starting with `heading`."""
    i = next(n for n, line in enumerate(lines) if line.startswith(heading))
    while not lines[i].startswith("|"):
        i += 1
    rows = []
    while i < len(lines) and lines[i].startswith("|"):
        if "---" not in lines[i]:
            rows.append([c.strip() for c in lines[i].strip("|").split("|")])
        i += 1
    return rows


lines = open(sys.argv[1]).read().splitlines()
musts, wants = table(lines, "## Musts"), table(lines, "## Wants")
options = musts[0][1:]
out = {o for n, o in enumerate(options) if any(r[n + 1] == "no" for r in musts)}
score = {o: sum(int(r[1]) * int(r[n + 2]) for r in wants[1:])
         for n, o in enumerate(options)}
best = sum(int(r[1]) * 5 for r in wants[1:])
for option in sorted(options, key=lambda o: (o in out, -score[o])):
    if option in out:
        print(f"{option:22} out: fails a must")
    else:
        print(f"{option:22} {score[option]} of {best}")
