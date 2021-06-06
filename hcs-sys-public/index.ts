import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import { projectName, GetTags } from "../util";

/**
 * CONFIGURATION
 */

export const clusterReqHandlerName = projectName + "-cluster-req-han";

/**
 * CONFIGURATION
 */

// Get pulumi configuration to enable dynamic deployments
let config = new pulumi.Config();

// Structured configuration input https://www.pulumi.com/docs/intro/concepts/config/#structured-configuration
interface Data {
  albClusterReqHandlerPort: number;
  clusterReqHandlerDesiredAmount: number;
  clusterReqHandlerMemory: number;
}

let configData = config.requireObject<Data>("data");

let albClusterReqHandlerPort = configData.albClusterReqHandlerPort || 80;
let clusterReqHandlerDesiredAmount =
  configData.clusterReqHandlerDesiredAmount || 1;
let clusterReqHandlerMemory = configData.clusterReqHandlerMemory || 128;

/**
 * 1. NETWORKING:
 * VPC - vpc for request handler cluster and gateway
 *  Private Subnet - vpc for request handler cluster
 *  Public Subnet - vpc for gateway
 * EC2 Gateway - WireGuard gateway
 *
 * 2. ARCHIVING:
 * ECR - request handler container image
 *
 * 3. CLUSTER:
 * ALB - application load balancer for ecs fargate tasks
 * ECS - elastic container cluster
 * Fargate - Fargate service task to run request-handler-container
 */

/**
 * 1. NETWORKING
 */
const nameVpc = `${projectName}-vpc`;
const vpc = new aws.ec2.Vpc(nameVpc, {
  cidrBlock: "10.0.0.0/24",
  tags: GetTags(nameVpc),
});
export const vpcId = vpc.id;

// create subnets - "public-gateway" and "private-processing"
const subnetPrivateProcessingName = `${nameVpc}-sn-priv-proc`;
const subnetPrivateProcessing = new aws.ec2.Subnet(
  subnetPrivateProcessingName,
  {
    vpcId: vpc.id,
    cidrBlock: "10.0.0.16/28",
    tags: GetTags(subnetPrivateProcessingName),
  }
);
const subnetPublicGatewayName = `${nameVpc}-subnet-public-gateway`;
const subnetPublicGateway = new aws.ec2.Subnet(subnetPublicGatewayName, {
  vpcId: vpc.id,
  cidrBlock: "10.0.0.144/28",
  tags: GetTags(subnetPublicGatewayName),
});

// create interface for ec2 gateway instance
const gatewayInterfaceName = `${projectName}-gw-net-interface`;
const gatewayInterface = new aws.ec2.NetworkInterface(gatewayInterfaceName, {
  subnetId: subnetPrivateProcessing.id,
  privateIps: ["10.0.0.30"],
  tags: {
    Name: gatewayInterfaceName,
  },
});

// create ec2 gateway instance
const AmazonLinux2AMIHVM = "ami-043097594a7df80ec";
const gwWireGuardInstanceName = `${projectName}-wireguard-gw-instance`;
const gwWireGuardInstance = new aws.ec2.Instance(gwWireGuardInstanceName, {
  ami: AmazonLinux2AMIHVM,
  instanceType: "t2.micro",
  networkInterfaces: [
    {
      networkInterfaceId: gatewayInterface.id,
      deviceIndex: 0,
    },
  ],
  creditSpecification: {
    cpuCredits: "unlimited",
  },
  tags: GetTags(gwWireGuardInstanceName),
});

/**
 * 2. ARCHIVING
 */
// Create a ECR container image.
const containerImage = awsx.ecs.Image.fromPath(
  `${projectName}-ecr`,
  "./req-handler-container"
);

/**
 * 3. CLUSTER
 */

// create log group to sort logs
const nameContainerLogGroupReqHandler = `${clusterReqHandlerName}-logg`;
const containerLogGroupReqHandler = new aws.cloudwatch.LogGroup(
  nameContainerLogGroupReqHandler,
  {
    retentionInDays: 3,
    tags: GetTags(nameContainerLogGroupReqHandler),
  }
);

// create an Application Load Balancer (ALB) which creates a public accessible endpoint for us to use
const albListenerReqHandler = new awsx.lb.ApplicationListener(
  `${clusterReqHandlerName}-alb`,
  { port: albClusterReqHandlerPort }
);

// Create an ECS cluster
const clusterReqHandler = new awsx.ecs.Cluster(clusterReqHandlerName, {
  tags: {
    Name: clusterReqHandlerName,
  },
});

// Deploy a Fargate Service into the new ECS cluster.
new awsx.ecs.FargateService(clusterReqHandlerName + "-svc", {
  cluster: clusterReqHandler,
  taskDefinitionArgs: {
    logGroup: containerLogGroupReqHandler,
    containers: {
      reqHandler: {
        image: containerImage,
        memory: clusterReqHandlerMemory,
        portMappings: [albListenerReqHandler],
      },
    },
  },
  desiredCount: clusterReqHandlerDesiredAmount,
});

// Export the application load balancer's address & gateway arn
export const urlAlbReqHandler = albListenerReqHandler.endpoint.hostname;
export const gwWireGuardInstanceArn = gwWireGuardInstance.arn;
