
                            # infra provider 
provider "aws" {
  region = "eu-west-1"
}

                            # CloudFront &  WAF provider
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}
