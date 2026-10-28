#!/usr/bin/env bash
# Run one command as the app:  tools/as-app.sh aws s3 ls ...
# Asks STS for the app role's temporary credentials, as ECS does for each
# task, and runs the command with them. EMULATOR ONLY: on AWS the role's
# trust policy lets ECS assume it, and nobody else — not alex.
set -euo pipefail
role=$(terraform -chdir="$(dirname "$0")/../infra" output -raw app_role_arn)
read -r AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN < <(
  aws sts assume-role --role-arn "$role" --role-session-name task-1 \
    --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' \
    --output text)
export AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN
exec "$@"
