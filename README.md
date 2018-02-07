# Overview
Based off the aws labs tutorial: https://github.com/awslabs/ecs-refarch-continuous-deployment

Tutorial readme can be found at TUTORIAL_README.md

There are two repositories for this project:
* the infrastructure: https://github.com/MatthewSilverstein/ecs-refarch-continuous-deployment
* the app: htetps://github.com/MatthewSilverstein/ecs-demo-php-simple-app

All commands for this tutorial are done from this repository. Idea is that this repository creates the infrastructure to deploy the app. the other repository is the app that gets deployed.

# Commands to replicate tutorial

* locally add the github secret access token to parameter-overrides-dev.properties, GitHubToken=***secretaccesstoken****

* aws cloudformation deploy --template-file ecs-refarch-continuous-deployment.yaml --stack-name my-ecs-stack --capabilities CAPABILITY_IAM --parameter-overrides  $(cat parameter-overrides-dev.properties)