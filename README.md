# Overview
Create a fully managed continuous deployment pipeline to deploy containers to fargate services.

Based off the aws labs tutorial: https://github.com/awslabs/ecs-refarch-continuous-deployment
Original tutorial readme can be found at TUTORIAL_README.md

# Commands to build this project
* set the correct github properties for deployment pipeline in the infrastructure/deployment/config/parameter-overrides.properties file
 * make sure to locally add the github secret access token to infrastructure parameter-overrides-dev.properties, GitHubToken=***secretaccesstoken****

* generate the deployment pipeline template
 * ./infrastructure/deployment/generate-template.sh
* deploy the pipeline
 * ./infrastructure/deployment/deploy-pipeline.sh