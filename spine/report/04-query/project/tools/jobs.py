"""The pipeline's jobs, as GitHub will read them:  python -m tools.jobs

Parses .github/workflows/infra.yml and prints each job: when it runs, what
it waits for, and which role it assumes."""
import yaml

with open(".github/workflows/infra.yml") as f:
    flow = yaml.safe_load(f)
for name, job in flow["jobs"].items():
    role = next((s["with"]["role-to-assume"].split(":")[4] for s in job["steps"]
                 if "role-to-assume" in s.get("with", {})), "-")
    print(f"{name:10} needs {job.get('needs', '-'):9} account {role:12}",
          job.get("environment", ""))
