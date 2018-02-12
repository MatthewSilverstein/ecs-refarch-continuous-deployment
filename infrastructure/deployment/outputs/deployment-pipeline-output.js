{
    "AWSTemplateFormatVersion": "2010-09-09", 
    "Description": "", 
    "Parameters": {
        "GitHubRepo": {
            "Type": "String"
        }, 
        "GitHubBranch": {
            "Type": "String"
        }, 
        "GitHubToken": {
            "Type": "String", 
            "NoEcho": true
        }, 
        "GitHubUser": {
            "Type": "String"
        }, 
        "AlphaStageName": {
            "Type": "String"
        }, 
        "BetaStageName": {
            "Type": "String"
        }, 
        "BuildSpecBuild": {
            "Type": "String"
        }
    }, 
    "Resources": {
        "CodePipelineServiceRole": {
            "Type": "AWS::IAM::Role", 
            "Properties": {
                "Path": "/", 
                "AssumeRolePolicyDocument": {
                    "Version": "2012-10-17", 
                    "Statement": [
                        {
                            "Effect": "Allow", 
                            "Principal": {
                                "Service": "codepipeline.amazonaws.com"
                            }, 
                            "Action": "sts:AssumeRole"
                        }
                    ]
                }, 
                "Policies": [
                    {
                        "PolicyName": "root", 
                        "PolicyDocument": {
                            "Version": "2012-10-17", 
                            "Statement": [
                                {
                                    "Resource": [
                                        {
                                            "Fn::Sub": "arn:aws:s3:::${ArtifactBucket}/*"
                                        }
                                    ], 
                                    "Effect": "Allow", 
                                    "Action": [
                                        "s3:PutObject", 
                                        "s3:GetObject", 
                                        "s3:GetObjectVersion", 
                                        "s3:GetBucketVersioning"
                                    ]
                                }, 
                                {
                                    "Resource": "*", 
                                    "Effect": "Allow", 
                                    "Action": [
                                        "ecs:DescribeServices", 
                                        "ecs:DescribeTaskDefinition", 
                                        "ecs:DescribeTasks", 
                                        "ecs:ListTasks", 
                                        "ecs:RegisterTaskDefinition", 
                                        "ecs:UpdateService", 
                                        "codebuild:StartBuild", 
                                        "codebuild:BatchGetBuilds", 
                                        "iam:PassRole", 
                                        "cloudformation:CreateChangeSet", 
                                        "cloudformation:DescribeChangeSet", 
                                        "cloudformation:DescribeStackResource", 
                                        "cloudformation:DescribeStackResources", 
                                        "cloudformation:DescribeStackEvents", 
                                        "cloudformation:DescribeStacks", 
                                        "cloudformation:GetTemplate", 
                                        "cloudformation:UpdateStack"
                                    ]
                                }, 
                                {
                                    "Resource": "*", 
                                    "Effect": "Allow", 
                                    "Action": "*"
                                }
                            ]
                        }
                    }
                ]
            }
        }, 
        "CloudFormationServiceRole": {
            "Type": "AWS::IAM::Role", 
            "Properties": {
                "Path": "/", 
                "AssumeRolePolicyDocument": {
                    "Version": "2012-10-17", 
                    "Statement": [
                        {
                            "Effect": "Allow", 
                            "Principal": {
                                "Service": "cloudformation.amazonaws.com"
                            }, 
                            "Action": "sts:AssumeRole"
                        }
                    ]
                }, 
                "Policies": [
                    {
                        "PolicyName": "root", 
                        "PolicyDocument": {
                            "Version": "2012-10-17", 
                            "Statement": [
                                {
                                    "Resource": "*", 
                                    "Effect": "Allow", 
                                    "Action": "*"
                                }
                            ]
                        }
                    }
                ]
            }
        }, 
        "ArtifactBucket": {
            "Type": "AWS::S3::Bucket", 
            "DeletionPolicy": "Retain"
        }, 
        "Pipeline": {
            "Type": "AWS::CodePipeline::Pipeline", 
            "Properties": {
                "RoleArn": {
                    "Fn::GetAtt": [
                        "CodePipelineServiceRole", 
                        "Arn"
                    ]
                }, 
                "ArtifactStore": {
                    "Type": "S3", 
                    "Location": {
                        "Ref": "ArtifactBucket"
                    }
                }, 
                "Stages": [
                    {
                        "Name": "Source", 
                        "Actions": [
                            {
                                "Name": "App", 
                                "ActionTypeId": {
                                    "Category": "Source", 
                                    "Owner": "ThirdParty", 
                                    "Version": 1, 
                                    "Provider": "GitHub"
                                }, 
                                "Configuration": {
                                    "Owner": {
                                        "Ref": "GitHubUser"
                                    }, 
                                    "Repo": {
                                        "Ref": "GitHubRepo"
                                    }, 
                                    "Branch": {
                                        "Ref": "GitHubBranch"
                                    }, 
                                    "OAuthToken": {
                                        "Ref": "GitHubToken"
                                    }
                                }, 
                                "OutputArtifacts": [
                                    {
                                        "Name": "App"
                                    }
                                ], 
                                "RunOrder": 1
                            }
                        ]
                    }, 
                    {
                        "Name": "Build", 
                        "Actions": [
                            {
                                "Name": "Build", 
                                "ActionTypeId": {
                                    "Category": "Build", 
                                    "Owner": "AWS", 
                                    "Version": 1, 
                                    "Provider": "CodeBuild"
                                }, 
                                "Configuration": {
                                    "ProjectName": {
                                        "Ref": "CodeBuildDockerBuild"
                                    }
                                }, 
                                "InputArtifacts": [
                                    {
                                        "Name": "App"
                                    }
                                ], 
                                "OutputArtifacts": [
                                    {
                                        "Name": "BuildOutput"
                                    }
                                ], 
                                "RunOrder": 1
                            }
                        ]
                    }, 
                    {
                        "Name": "Alpha", 
                        "Actions": [
                            {
                                "Name": "AlphaInfrastructureCreateChangeSet", 
                                "ActionTypeId": {
                                    "Category": "Deploy", 
                                    "Owner": "AWS", 
                                    "Provider": "CloudFormation", 
                                    "Version": 1
                                }, 
                                "Configuration": {
                                    "ActionMode": "CHANGE_SET_REPLACE", 
                                    "RoleArn": {
                                        "Fn::GetAtt": [
                                            "CloudFormationServiceRole", 
                                            "Arn"
                                        ]
                                    }, 
                                    "Capabilities": "CAPABILITY_NAMED_IAM", 
                                    "StackName": {
                                        "Ref": "AlphaStageName"
                                    }, 
                                    "ChangeSetName": {
                                        "Fn::Sub": "${AlphaStageName}-ChangeSet"
                                    }, 
                                    "TemplateConfiguration": "BuildOutput::service-infrastructure-parameter-overrides-alpha.properties", 
                                    "TemplatePath": "BuildOutput::service-infrastructure-output.js"
                                }, 
                                "InputArtifacts": [
                                    {
                                        "Name": "BuildOutput"
                                    }
                                ], 
                                "RunOrder": 1
                            }, 
                            {
                                "Name": "AlphaInfrastructureExecuteChangeSet", 
                                "ActionTypeId": {
                                    "Category": "Deploy", 
                                    "Owner": "AWS", 
                                    "Provider": "CloudFormation", 
                                    "Version": 1
                                }, 
                                "Configuration": {
                                    "ActionMode": "CHANGE_SET_EXECUTE", 
                                    "ChangeSetName": {
                                        "Fn::Sub": "${AlphaStageName}-ChangeSet"
                                    }, 
                                    "RoleArn": {
                                        "Fn::GetAtt": [
                                            "CloudFormationServiceRole", 
                                            "Arn"
                                        ]
                                    }, 
                                    "StackName": {
                                        "Ref": "AlphaStageName"
                                    }
                                }, 
                                "RunOrder": 2
                            }, 
                            {
                                "Name": "AlphaDeployContainer", 
                                "ActionTypeId": {
                                    "Category": "Deploy", 
                                    "Owner": "AWS", 
                                    "Version": 1, 
                                    "Provider": "ECS"
                                }, 
                                "Configuration": {
                                    "ClusterName": {
                                        "Fn::ImportValue": {
                                            "Fn::Sub": "${AlphaStageName}-ClusterName"
                                        }
                                    }, 
                                    "ServiceName": {
                                        "Fn::ImportValue": {
                                            "Fn::Sub": "${AlphaStageName}-Service"
                                        }
                                    }, 
                                    "FileName": "images.json"
                                }, 
                                "InputArtifacts": [
                                    {
                                        "Name": "BuildOutput"
                                    }
                                ], 
                                "RunOrder": 3
                            }
                        ]
                    }, 
                    {
                        "Name": "Beta", 
                        "Actions": [
                            {
                                "Name": "BetaInfrastructureCreateChangeSet", 
                                "ActionTypeId": {
                                    "Category": "Deploy", 
                                    "Owner": "AWS", 
                                    "Provider": "CloudFormation", 
                                    "Version": 1
                                }, 
                                "Configuration": {
                                    "ActionMode": "CHANGE_SET_REPLACE", 
                                    "RoleArn": {
                                        "Fn::GetAtt": [
                                            "CloudFormationServiceRole", 
                                            "Arn"
                                        ]
                                    }, 
                                    "Capabilities": "CAPABILITY_NAMED_IAM", 
                                    "StackName": {
                                        "Ref": "BetaStageName"
                                    }, 
                                    "ChangeSetName": {
                                        "Fn::Sub": "${BetaStageName}-ChangeSet"
                                    }, 
                                    "TemplateConfiguration": "BuildOutput::service-infrastructure-parameter-overrides-beta.properties", 
                                    "TemplatePath": "BuildOutput::service-infrastructure-output.js"
                                }, 
                                "InputArtifacts": [
                                    {
                                        "Name": "BuildOutput"
                                    }
                                ], 
                                "RunOrder": 1
                            }, 
                            {
                                "Name": "BetaInfrastructureExecuteChangeSet", 
                                "ActionTypeId": {
                                    "Category": "Deploy", 
                                    "Owner": "AWS", 
                                    "Provider": "CloudFormation", 
                                    "Version": 1
                                }, 
                                "Configuration": {
                                    "ActionMode": "CHANGE_SET_EXECUTE", 
                                    "ChangeSetName": {
                                        "Fn::Sub": "${BetaStageName}-ChangeSet"
                                    }, 
                                    "RoleArn": {
                                        "Fn::GetAtt": [
                                            "CloudFormationServiceRole", 
                                            "Arn"
                                        ]
                                    }, 
                                    "StackName": {
                                        "Ref": "BetaStageName"
                                    }
                                }, 
                                "RunOrder": 2
                            }, 
                            {
                                "Name": "BetaDeployContainer", 
                                "ActionTypeId": {
                                    "Category": "Deploy", 
                                    "Owner": "AWS", 
                                    "Version": 1, 
                                    "Provider": "ECS"
                                }, 
                                "Configuration": {
                                    "ClusterName": {
                                        "Fn::ImportValue": {
                                            "Fn::Sub": "${BetaStageName}-ClusterName"
                                        }
                                    }, 
                                    "ServiceName": {
                                        "Fn::ImportValue": {
                                            "Fn::Sub": "${BetaStageName}-Service"
                                        }
                                    }, 
                                    "FileName": "images.json"
                                }, 
                                "InputArtifacts": [
                                    {
                                        "Name": "BuildOutput"
                                    }
                                ], 
                                "RunOrder": 3
                            }
                        ]
                    }
                ]
            }
        }, 
        "Repository": {
            "Type": "AWS::ECR::Repository", 
            "DeletionPolicy": "Retain"
        }, 
        "CodeBuildDockerBuildServiceRole": {
            "Type": "AWS::IAM::Role", 
            "Properties": {
                "Path": "/", 
                "AssumeRolePolicyDocument": {
                    "Version": "2012-10-17", 
                    "Statement": [
                        {
                            "Effect": "Allow", 
                            "Principal": {
                                "Service": "codebuild.amazonaws.com"
                            }, 
                            "Action": "sts:AssumeRole"
                        }
                    ]
                }, 
                "Policies": [
                    {
                        "PolicyName": "root", 
                        "PolicyDocument": {
                            "Version": "2012-10-17", 
                            "Statement": [
                                {
                                    "Resource": "*", 
                                    "Effect": "Allow", 
                                    "Action": [
                                        "logs:CreateLogGroup", 
                                        "logs:CreateLogStream", 
                                        "logs:PutLogEvents", 
                                        "ecr:GetAuthorizationToken"
                                    ]
                                }, 
                                {
                                    "Resource": {
                                        "Fn::Sub": "arn:aws:s3:::${ArtifactBucket}/*"
                                    }, 
                                    "Effect": "Allow", 
                                    "Action": [
                                        "s3:GetObject", 
                                        "s3:PutObject", 
                                        "s3:GetObjectVersion"
                                    ]
                                }, 
                                {
                                    "Resource": {
                                        "Fn::Sub": "arn:aws:ecr:${AWS::Region}:${AWS::AccountId}:repository/${Repository}"
                                    }, 
                                    "Effect": "Allow", 
                                    "Action": [
                                        "ecr:GetDownloadUrlForLayer", 
                                        "ecr:BatchGetImage", 
                                        "ecr:BatchCheckLayerAvailability", 
                                        "ecr:PutImage", 
                                        "ecr:InitiateLayerUpload", 
                                        "ecr:UploadLayerPart", 
                                        "ecr:CompleteLayerUpload"
                                    ]
                                }
                            ]
                        }
                    }
                ]
            }
        }, 
        "CodeBuildDockerBuild": {
            "Type": "AWS::CodeBuild::Project", 
            "Properties": {
                "Artifacts": {
                    "Type": "CODEPIPELINE"
                }, 
                "Source": {
                    "Type": "CODEPIPELINE", 
                    "BuildSpec": {
                        "Ref": "BuildSpecBuild"
                    }
                }, 
                "Environment": {
                    "ComputeType": "BUILD_GENERAL1_SMALL", 
                    "Image": "aws/codebuild/docker:17.09.0", 
                    "Type": "LINUX_CONTAINER", 
                    "EnvironmentVariables": [
                        {
                            "Name": "AWS_DEFAULT_REGION", 
                            "Value": {
                                "Ref": "AWS::Region"
                            }
                        }, 
                        {
                            "Name": "REPOSITORY_URI", 
                            "Value": {
                                "Fn::Sub": "${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${Repository}"
                            }
                        }
                    ]
                }, 
                "Name": {
                    "Fn::Sub": "${AWS::StackName}CodeBuildDockerBuild"
                }, 
                "ServiceRole": {
                    "Ref": "CodeBuildDockerBuildServiceRole"
                }
            }
        }
    }, 
    "Outputs": {
        "PipelineUrl": {
            "Value": {
                "Fn::Sub": "https://console.aws.amazon.com/codepipeline/home?region=${AWS::Region}#/view/${Pipeline}"
            }
        }
    }
}