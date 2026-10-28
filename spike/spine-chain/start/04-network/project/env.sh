# Every command in this project runs in the shop's Region.
export AWS_DEFAULT_REGION=eu-west-2

# The emulator: the real AWS CLI, SDK and Terraform, pointed at a local moto server.
# For AWS itself: delete these three lines, `export AWS_PROFILE=book-shop-dev`.
export AWS_ENDPOINT_URL=http://localhost:5000
export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
