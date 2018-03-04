aws cloudformation deploy --template-file infrastructure/deployment/outputs/deployment-pipeline-output.js --stack-name my-deployment-pipeline --capabilities CAPABILITY_IAM --parameter-overrides $(cat infrastructure/deployment/config/deployment-parameter-overrides.properties)