import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import {
  clusterReqHandlerMemory,
  clusterReqHandlerDesiredAmount,
} from "./config";
import {
  projectName,
  GetTags,
  clusterReqHandlerName,
  albClusterReqHandlerPort,
} from "./config";

/**
 * 1. NETWORKING:
 * VPC - vpc for request handler cluster and gateway
 *  Private Subnet - vpc for request handler cluster
 *  Public Subnet - vpc for gateway
 * EC2 Gateway - WireGuard gateway
 *
 * 2. ARCHIVING:
 * ECR - request handler repository
 *
 * 3. PROCESSING:
 * ALB - application load balancer for ecs fargate tasks
 * ECS - elastic container cluster
 * Fargate - Fargate service task to run request-handler-container
 */

/**
 * 1. NETWORKING
 */
const nameVpc = `${projectName}-vpc`;
const vpc = new aws.ec2.Vpc(nameVpc, {
  cidrBlock: "10.200.0.0/24",
  tags: GetTags(nameVpc),
});
export const vpcId = vpc.id;

// create subnets - "public-gateway" and "private-processing"
const subnetPrivateProcessingName = `${nameVpc}-subnet-private-processing`;
const subnetPrivateProcessing = new aws.ec2.Subnet(
  subnetPrivateProcessingName,
  {
    vpcId: vpc.id,
    cidrBlock: "10.200.200.0/24",
    tags: GetTags(subnetPrivateProcessingName),
  }
);
const subnetPublicGatewayName = `${nameVpc}-subnet-public-gateway`;
const subnetPublicGateway = new aws.ec2.Subnet(subnetPublicGatewayName, {
  vpcId: vpc.id,
  cidrBlock: "10.200.100.0/24",
  tags: GetTags(subnetPublicGatewayName),
});

// create interface for ec2 gateway instance
const gatewayInterfaceName = `${projectName}-gw-network-interface`;
const gatewayInterface = new aws.ec2.NetworkInterface(gatewayInterfaceName, {
  subnetId: subnetPrivateProcessing.id,
  privateIps: ["10.200.100.1"],
  tags: {
    Name: gatewayInterfaceName,
  },
});

// create ec2 gateway instance
const gwWireGuardInstanceName = `${projectName}-wireguard-gw-instance`;
const gwWireGuardInstance = new aws.ec2.Instance(gwWireGuardInstanceName, {
  ami: "ami-005e54dee72cc1d00",
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
// Create a ECR repository.
const repo = new awsx.ecr.Repository(`${projectName}-ecr`);
// And publish its URL, so we can push to it if we'd like.
export const ecrUrl = repo.repository.repositoryUrl;

/**
 * 3. PROCESSING
 */

// create log group to sort logs
const nameContainerLogGroupReqHandler = `${clusterReqHandlerName}-log-group`;
const containerLogGroupReqHandler = new aws.cloudwatch.LogGroup(
  nameContainerLogGroupReqHandler,
  {
    retentionInDays: 7,
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
const serviceFargateReqHandler = new awsx.ecs.FargateService(
  clusterReqHandlerName + "-service",
  {
    cluster: clusterReqHandler,
    taskDefinitionArgs: {
      logGroup: containerLogGroupReqHandler,
      containers: {
        nginx: {
          image: "nginx", // todo: reference ecr repository image
          memory: clusterReqHandlerMemory,
          portMappings: [albListenerReqHandler],
        },
      },
    },
    desiredCount: clusterReqHandlerDesiredAmount,
  }
);

// Export the application load balancer's address so that it's easy to access.
export const urlAlbReqHandler = albListenerReqHandler.endpoint.hostname;
