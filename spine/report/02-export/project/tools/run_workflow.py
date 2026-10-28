"""Walk the checkout workflow locally:  python -m tools.run_workflow 10

The emulator records the state machine but runs no step, so this walks
checkout.asl.json itself: each Task calls the step's real code (the stock
changes are real, in the emulator's table); only the payment provider's
answers are stand-ins, scripted per order below. Waits are counted, not slept.
"""
import json
import sys

from functions.checkout import steps

ANSWERS = {10: ["timeout", "timeout", "ok"], 11: ["declined"]}  # stand-ins
ORDERS = {10: {"order": 10, "books": {"bk-1001": 1}, "total": 10.99},
          11: {"order": 11, "books": {"bk-1001": 2}, "total": 21.98}}

order = int(sys.argv[1])
answers = iter(ANSWERS[order])
steps.provider = lambda _: next(answers)
with open("workflows/checkout.asl.json") as f:
    machine = json.load(f)
task = {f"${{{name}}}": getattr(steps, name)
        for name in ("reserve", "charge", "ship", "release")}

data, at, name = ORDERS[order], 0, machine["StartAt"]
print(f"order {order}, stand-in payment answers {ANSWERS[order]}")
while True:
    state = machine["States"][name]
    if state["Type"] == "Fail":
        print(f"{at:3} s  {name:13} execution FAILED: {state['Error']}")
        break
    tries = 0
    while True:
        try:
            result = task[state["Resource"]](data)
            print(f"{at:3} s  {name:13} ok")
            data, error = result, None
            break
        except Exception as e:  # what Lambda reports: the error's type
            error = type(e).__name__
            retry = next((r for r in state.get("Retry", [])
                          if error in r["ErrorEquals"]), None)
            if retry and tries < retry["MaxAttempts"]:
                wait = retry["IntervalSeconds"] * retry["BackoffRate"] ** tries
                print(f"{at:3} s  {name:13} {error}, retry in {wait:g} s")
                at, tries = at + int(wait), tries + 1
                continue
            print(f"{at:3} s  {name:13} {error}: caught")
            break
    if error:
        catch = next(c for c in state["Catch"] if error in c["ErrorEquals"]
                     or "States.ALL" in c["ErrorEquals"])
        data, name = {**data, "error": error}, catch["Next"]
    elif state.get("End"):
        print(f"{at:3} s  execution SUCCEEDED")
        break
    else:
        name = state["Next"]
