{
    "AWSTemplateFormatVersion": "2010-09-09", 
    "Description": "", 
    "Parameters": {
        "InstanceType": {
            "Type": "String", 
            "Default": "t2.micro"
        }, 
        "ClusterSize": {
            "Type": "Number", 
            "Default": 2
        }, 
        "StageName": {
            "Type": "String"
        }, 
        "VpcName": {
            "Type": "String"
        }, 
        "VpcCIDR": {
            "Type": "String"
        }, 
        "Subnet1CIDR": {
            "Type": "String"
        }, 
        "Subnet2CIDR": {
            "Type": "String"
        }, 
        "DesiredCount": {
            "Type": "Number", 
            "Default": 1
        }, 
        "LaunchType": {
            "Type": "String", 
            "Default": "Fargate", 
            "AllowedValues": [
                "Fargate"
            ]
        }
    }, 
    "Mappings": {
        "AWSRegionToAMI": {
            "ap-south-1": {
                "AMI": "ami-00491f6f"
            }, 
            "eu-west-3": {
                "AMI": "ami-9aef59e7"
            }, 
            "eu-west-2": {
                "AMI": "ami-67cbd003"
            }, 
            "eu-west-1": {
                "AMI": "ami-1d46df64"
            }, 
            "ap-northeast-2": {
                "AMI": "ami-c212b2ac"
            }, 
            "ap-northeast-1": {
                "AMI": "ami-872c4ae1"
            }, 
            "sa-east-1": {
                "AMI": "ami-af521fc3"
            }, 
            "ca-central-1": {
                "AMI": "ami-435bde27"
            }, 
            "ap-southeast-1": {
                "AMI": "ami-910d72ed"
            }, 
            "ap-southeast-2": {
                "AMI": "ami-58bb443a"
            }, 
            "eu-central-1": {
                "AMI": "ami-509a053f"
            }, 
            "us-east-1": {
                "AMI": "ami-28456852"
            }, 
            "us-east-2": {
                "AMI": "ami-ce1c36ab"
            }, 
            "us-west-1": {
                "AMI": "ami-74262414"
            }, 
            "us-west-2": {
                "AMI": "ami-decc7fa6"
            }
        }
    }, 
    "Resources": {
        "Cluster": {
            "Type": "AWS::ECS::Cluster", 
            "Properties": {
                "ClusterName": {
                    "Ref": "AWS::StackName"
                }
            }
        }, 
        "VPC": {
            "Type": "AWS::EC2::VPC", 
            "Properties": {
                "CidrBlock": {
                    "Ref": "VpcCIDR"
                }, 
                "Tags": [
                    {
                        "Key": "Name", 
                        "Value": {
                            "Ref": "VpcName"
                        }
                    }
                ]
            }
        }, 
        "InternetGateway": {
            "Type": "AWS::EC2::InternetGateway", 
            "Properties": {
                "Tags": [
                    {
                        "Key": "Name", 
                        "Value": {
                            "Ref": "VpcName"
                        }
                    }
                ]
            }
        }, 
        "InternetGatewayAttachment": {
            "Type": "AWS::EC2::VPCGatewayAttachment", 
            "Properties": {
                "InternetGatewayId": {
                    "Ref": "InternetGateway"
                }, 
                "VpcId": {
                    "Ref": "VPC"
                }
            }
        }, 
        "Subnet1": {
            "Type": "AWS::EC2::Subnet", 
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                }, 
                "AvailabilityZone": {
                    "Fn::Select": [
                        0, 
                        {
                            "Fn::GetAZs": ""
                        }
                    ]
                }, 
                "MapPublicIpOnLaunch": true, 
                "CidrBlock": {
                    "Ref": "Subnet1CIDR"
                }, 
                "Tags": [
                    {
                        "Key": "Name", 
                        "Value": {
                            "Fn::Sub": "${VpcName} (Public)"
                        }
                    }
                ]
            }
        }, 
        "Subnet2": {
            "Type": "AWS::EC2::Subnet", 
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                }, 
                "AvailabilityZone": {
                    "Fn::Select": [
                        1, 
                        {
                            "Fn::GetAZs": ""
                        }
                    ]
                }, 
                "MapPublicIpOnLaunch": true, 
                "CidrBlock": {
                    "Ref": "Subnet2CIDR"
                }, 
                "Tags": [
                    {
                        "Key": "Name", 
                        "Value": {
                            "Fn::Sub": "${VpcName} (Public)"
                        }
                    }
                ]
            }
        }, 
        "RouteTable": {
            "Type": "AWS::EC2::RouteTable", 
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                }, 
                "Tags": [
                    {
                        "Key": "Name", 
                        "Value": {
                            "Ref": "VpcName"
                        }
                    }
                ]
            }
        }, 
        "DefaultRoute": {
            "Type": "AWS::EC2::Route", 
            "Properties": {
                "RouteTableId": {
                    "Ref": "RouteTable"
                }, 
                "DestinationCidrBlock": "0.0.0.0/0", 
                "GatewayId": {
                    "Ref": "InternetGateway"
                }
            }
        }, 
        "Subnet1RouteTableAssociation": {
            "Type": "AWS::EC2::SubnetRouteTableAssociation", 
            "Properties": {
                "RouteTableId": {
                    "Ref": "RouteTable"
                }, 
                "SubnetId": {
                    "Ref": "Subnet1"
                }
            }
        }, 
        "Subnet2RouteTableAssociation": {
            "Type": "AWS::EC2::SubnetRouteTableAssociation", 
            "Properties": {
                "RouteTableId": {
                    "Ref": "RouteTable"
                }, 
                "SubnetId": {
                    "Ref": "Subnet2"
                }
            }
        }, 
        "SecurityGroup": {
            "Type": "AWS::EC2::SecurityGroup", 
            "Properties": {
                "GroupDescription": {
                    "Fn::Sub": "${AWS::StackName}-alb"
                }, 
                "SecurityGroupIngress": [
                    {
                        "CidrIp": "0.0.0.0/0", 
                        "IpProtocol": "TCP", 
                        "FromPort": 80, 
                        "ToPort": 80
                    }
                ], 
                "VpcId": {
                    "Ref": "VPC"
                }
            }
        }, 
        "LoadBalancer": {
            "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer", 
            "Properties": {
                "Subnets": [
                    {
                        "Ref": "Subnet1"
                    }, 
                    {
                        "Ref": "Subnet2"
                    }
                ], 
                "SecurityGroups": [
                    {
                        "Ref": "SecurityGroup"
                    }
                ]
            }
        }, 
        "LoadBalancerListener": {
            "Type": "AWS::ElasticLoadBalancingV2::Listener", 
            "Properties": {
                "LoadBalancerArn": {
                    "Ref": "LoadBalancer"
                }, 
                "Port": 80, 
                "Protocol": "HTTP", 
                "DefaultActions": [
                    {
                        "Type": "forward", 
                        "TargetGroupArn": {
                            "Ref": "TargetGroup"
                        }
                    }
                ]
            }
        }, 
        "TargetGroup": {
            "Type": "AWS::ElasticLoadBalancingV2::TargetGroup", 
            "DependsOn": "LoadBalancer", 
            "Properties": {
                "VpcId": {
                    "Ref": "VPC"
                }, 
                "Port": 80, 
                "Protocol": "HTTP", 
                "Matcher": {
                    "HttpCode": "200-299"
                }, 
                "HealthCheckIntervalSeconds": 10, 
                "HealthCheckPath": "/", 
                "HealthCheckProtocol": "HTTP", 
                "HealthCheckTimeoutSeconds": 5, 
                "HealthyThresholdCount": 2, 
                "TargetType": "ip", 
                "TargetGroupAttributes": [
                    {
                        "Key": "deregistration_delay.timeout_seconds", 
                        "Value": 30
                    }
                ]
            }
        }, 
        "ListenerRule": {
            "Type": "AWS::ElasticLoadBalancingV2::ListenerRule", 
            "Properties": {
                "ListenerArn": {
                    "Ref": "LoadBalancerListener"
                }, 
                "Priority": 1, 
                "Conditions": [
                    {
                        "Field": "path-pattern", 
                        "Values": [
                            "/"
                        ]
                    }
                ], 
                "Actions": [
                    {
                        "TargetGroupArn": {
                            "Ref": "TargetGroup"
                        }, 
                        "Type": "forward"
                    }
                ]
            }
        }, 
        "TaskExecutionRole": {
            "Type": "AWS::IAM::Role", 
            "Properties": {
                "Path": "/", 
                "AssumeRolePolicyDocument": {
                    "Version": "2012-10-17", 
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole", 
                            "Effect": "Allow", 
                            "Principal": {
                                "Service": "ecs-tasks.amazonaws.com"
                            }
                        }
                    ]
                }, 
                "ManagedPolicyArns": [
                    "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
                ]
            }
        }, 
        "LogGroup": {
            "Type": "AWS::Logs::LogGroup", 
            "Properties": {
                "LogGroupName": {
                    "Fn::Sub": "/ecs/${AWS::StackName}"
                }
            }
        }, 
        "FargateService": {
            "DependsOn": [
                "TargetGroup", 
                "ListenerRule"
            ], 
            "Type": "AWS::ECS::Service", 
            "Properties": {
                "Cluster": {
                    "Ref": "Cluster"
                }, 
                "DesiredCount": {
                    "Ref": "DesiredCount"
                }, 
                "TaskDefinition": {
                    "Ref": "TaskDefinition"
                }, 
                "LaunchType": "FARGATE", 
                "NetworkConfiguration": {
                    "AwsvpcConfiguration": {
                        "AssignPublicIp": "ENABLED", 
                        "SecurityGroups": [
                            {
                                "Ref": "SecurityGroup"
                            }
                        ], 
                        "Subnets": [
                            {
                                "Ref": "Subnet1"
                            }, 
                            {
                                "Ref": "Subnet2"
                            }
                        ]
                    }
                }, 
                "LoadBalancers": [
                    {
                        "ContainerName": "simple-app", 
                        "ContainerPort": 80, 
                        "TargetGroupArn": {
                            "Ref": "TargetGroup"
                        }
                    }
                ]
            }
        }, 
        "TaskDefinition": {
            "Type": "AWS::ECS::TaskDefinition", 
            "Properties": {
                "Family": {
                    "Fn::Sub": "${AWS::StackName}-simple-app"
                }, 
                "RequiresCompatibilities": [
                    "FARGATE"
                ], 
                "Memory": 512, 
                "Cpu": 256, 
                "NetworkMode": "awsvpc", 
                "ExecutionRoleArn": {
                    "Ref": "TaskExecutionRole"
                }, 
                "ContainerDefinitions": [
                    {
                        "Name": "simple-app", 
                        "Image": "amazon/amazon-ecs-sample", 
                        "EntryPoint": [
                            "/usr/sbin/apache2", 
                            "-D", 
                            "FOREGROUND"
                        ], 
                        "Essential": true, 
                        "Memory": 256, 
                        "MountPoints": [
                            {
                                "SourceVolume": "my-vol", 
                                "ContainerPath": "/var/www/my-vol"
                            }
                        ], 
                        "PortMappings": [
                            {
                                "ContainerPort": 80
                            }
                        ], 
                        "LogConfiguration": {
                            "LogDriver": "awslogs", 
                            "Options": {
                                "awslogs-region": {
                                    "Ref": "AWS::Region"
                                }, 
                                "awslogs-group": {
                                    "Ref": "LogGroup"
                                }, 
                                "awslogs-stream-prefix": {
                                    "Ref": "AWS::StackName"
                                }
                            }
                        }
                    }, 
                    {
                        "Name": "busybox", 
                        "Image": "busybox", 
                        "EntryPoint": [
                            "sh", 
                            "-c"
                        ], 
                        "Essential": true, 
                        "Memory": 256, 
                        "VolumesFrom": [
                            {
                                "SourceContainer": "simple-app"
                            }
                        ], 
                        "Command": [
                            "/bin/sh -c \"while true; do /bin/date > /var/www/my-vol/date; sleep 1; done\""
                        ]
                    }
                ], 
                "Volumes": [
                    {
                        "Name": "my-vol"
                    }
                ]
            }
        }
    }, 
    "Outputs": {
        "ClusterName": {
            "Value": {
                "Ref": "Cluster"
            }, 
            "Export": {
                "Name": {
                    "Fn::Sub": "${StageName}-ClusterName"
                }
            }
        }, 
        "ServiceUrl": {
            "Description": "URL of the load balancer for the sample service.", 
            "Value": {
                "Fn::Sub": "http://${LoadBalancer.DNSName}"
            }
        }, 
        "Service": {
            "Value": {
                "Ref": "FargateService"
            }, 
            "Export": {
                "Name": {
                    "Fn::Sub": "${StageName}-Service"
                }
            }
        }
    }
}