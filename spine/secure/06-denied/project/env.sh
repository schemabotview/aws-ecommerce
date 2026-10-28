# Every command in this project uses the shop's profiles and Region.
export AWS_CONFIG_FILE=$PWD/aws-config
export AWS_DEFAULT_REGION=eu-west-2

# The emulator: the real AWS CLI, SDKs and Terraform, aimed at local moto.
# For AWS itself: delete these three lines, set AWS_PROFILE=book-shop-dev
# and run `aws sso login`.
export AWS_ENDPOINT_URL=http://localhost:5000
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
