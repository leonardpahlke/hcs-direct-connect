import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import { projectName, GetTags } from "../../util";

const clusterReqHandlerName = projectName + "-cluster-req-han";

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
  keyPairName: string;
}

let configData = config.requireObject<Data>("data");

let albClusterReqHandlerPort = configData.albClusterReqHandlerPort || 8000;
let clusterReqHandlerDesiredAmount =
  configData.clusterReqHandlerDesiredAmount || 1;
let clusterReqHandlerMemory = configData.clusterReqHandlerMemory || 128;
let keyPairName = configData.keyPairName || "hcs-gw-key";

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
const subnetPrivateProcessingName = `${nameVpc}-sn-priv-proc`;
const subnetPublicGatewayName = `${nameVpc}-subnet-public-gw`;
const vpc = new awsx.ec2.Vpc(nameVpc, {
  cidrBlock: "10.0.0.0/24",
  numberOfAvailabilityZones: 2,
  subnets: [
    { type: "isolated", name: subnetPublicGatewayName },
    { type: "isolated", name: subnetPrivateProcessingName },
  ],
  tags: GetTags(nameVpc),
});

// Export a few resulting fields to make them easy to use:
export const vpcId = vpc.id;
const subnetPrivateProcessing = pulumi.output(vpc.isolatedSubnets)[0].subnet;
const subnetPublicGateway = pulumi.output(vpc.isolatedSubnets)[1].subnet;
const subnetPrivateProcessingCidr = subnetPrivateProcessing.cidrBlock;
// Create subnets - "public-gateway" and "private-processing"
// const subnetPrivateProcessingName = `${nameVpc}-sn-priv-proc`;
// const subnetPrivateProcessingCidr = "10.0.0.16/28";
// const subnetPrivateProcessing = new aws.ec2.Subnet(
//   subnetPrivateProcessingName,
//   {
//     vpcId: vpc.id,
//     cidrBlock: subnetPrivateProcessingCidr,
//     tags: GetTags(subnetPrivateProcessingName),
//   }
// );
// const subnetPublicGatewayName = `${nameVpc}-subnet-public-gw`;
// const subnetPublicGatewayCidr = "10.0.0.144/28";
// const subnetPublicGateway = new aws.ec2.Subnet(subnetPublicGatewayName, {
//   vpcId: vpc.id,
//   cidrBlock: subnetPublicGatewayCidr,
//   mapPublicIpOnLaunch: true,
//   tags: GetTags(subnetPublicGatewayName),
// });

// Create a internet gateway and attach it to the VPC to get internet access
// const internetGatewayName = `${nameVpc}-igw`;
// const igw = new aws.ec2.InternetGateway(internetGatewayName, {
//   vpcId: vpc.id,
//   tags: GetTags(internetGatewayName),
// });

// Create a security group which is attach to the Gateway Instance and functions as a firewall
const sgGatewayName = `${nameVpc}-sg-nat`;
const natSecurityGroup = new aws.ec2.SecurityGroup(sgGatewayName, {
  description: "Allow TLS inbound traffic",
  vpcId: vpc.id,
  ingress: [
    {
      description:
        "Allow inbound HTTP traffic from servers in the private subnet",
      fromPort: 80,
      toPort: 80,
      protocol: "TCP",
      cidrBlocks: [subnetPrivateProcessingCidr],
    },
    {
      description: "Allow inbound ICMP traffic",
      fromPort: -1,
      toPort: -1,
      protocol: "ICMP",
      cidrBlocks: ["0.0.0.0/0"],
    },
    {
      description:
        "Allow inbound HTTPS traffic from servers in the private subnet",
      fromPort: 443,
      toPort: 443,
      protocol: "TCP",
      cidrBlocks: [subnetPrivateProcessingCidr],
    },
    {
      description:
        "Allow inbound SSH access to the NAT instance from your home network (over the internet gateway) ",
      fromPort: 22,
      toPort: 22,
      protocol: "TCP",
      cidrBlocks: ["0.0.0.0/0"],
    },
    {
      description: "Allow inbound UDP access to wireguard port",
      fromPort: 51820,
      toPort: 51820,
      protocol: "UDP",
      cidrBlocks: ["0.0.0.0/0"],
    },
  ],
  egress: [
    {
      description: "Allow outbound HTTP access to the internet",
      fromPort: 80,
      toPort: 80,
      protocol: "TCP",
      cidrBlocks: ["0.0.0.0/0"],
    },
    {
      description: "Allow outbound HTTPS access to the internet",
      fromPort: 443,
      toPort: 443,
      protocol: "TCP",
      cidrBlocks: ["0.0.0.0/0"],
    },
    {
      description: "Allow outbound ICMP traffic access to the internet",
      fromPort: -1,
      toPort: -1,
      protocol: "ICMP",
      cidrBlocks: ["0.0.0.0/0"],
    },
    {
      description: "Allow outbound UDP access to wireguard port",
      fromPort: 51820,
      toPort: 51820,
      protocol: "UDP",
      cidrBlocks: ["0.0.0.0/0"],
    },
  ],
  tags: GetTags(sgGatewayName),
});

// Create interface for ec2 gateway instance (AWS Elastic Network Interface (ENI))
const natENIName = `${projectName}-nat-eni`;
const natENI = new aws.ec2.NetworkInterface(natENIName, {
  subnetId: subnetPublicGateway.id,
  securityGroups: [natSecurityGroup.id],
  sourceDestCheck: false,
  tags: GetTags(natENIName),
});

// Create EC2 gateway instance which will redirect traffic thorugh a VPN-Tunnel to WireGuard
const AmiUbuntuHVM2004 = "ami-05f7491af5eef733a";
const natInstanceName = `${projectName}-nat-instance`;
const natInstance = new aws.ec2.Instance(natInstanceName, {
  ami: AmiUbuntuHVM2004,
  instanceType: "t2.micro",
  networkInterfaces: [
    {
      networkInterfaceId: natENI.id,
      deviceIndex: 0,
    },
  ],
  keyName: keyPairName,
  creditSpecification: {
    cpuCredits: "unlimited",
  },
  //sourceDestCheck: false,
  tags: GetTags(natInstanceName),
});

// Create a RouteTable to redirect traffic from the private-subnet to the gateway-subnet
// const snRouteTableNamePublic = `${subnetPublicGatewayName}-rt`;
// const snPublicRouteTable = new aws.ec2.RouteTable(snRouteTableNamePublic, {
//   vpcId: vpc.id,
//   routes: [
//     {
//       cidrBlock: "0.0.0.0/0",
//       gatewayId: igw.id,
//     },
//   ],
//   tags: GetTags(snRouteTableNamePublic),
// });
// // Associate the Route-Table to the public subnet
// const snPublicRouteTableAssociation = new aws.ec2.RouteTableAssociation(
//   `${snRouteTableNamePublic}-asso`,
//   {
//     subnetId: subnetPublicGateway.id,
//     routeTableId: snPublicRouteTable.id,
//   }
// );

const snRouteTableNamePrivate = `${subnetPrivateProcessingName}-rt`;
const snPrivateRouteTable = new aws.ec2.RouteTable(snRouteTableNamePrivate, {
  vpcId: vpc.id,
  routes: [
    {
      cidrBlock: "0.0.0.0/0",
      instanceId: natInstance.id,
    },
  ],
  tags: GetTags(snRouteTableNamePrivate),
});
// Associate the Route-Table to the private subnet
// const snPrivateRouteTableAssociation = new aws.ec2.RouteTableAssociation(
//   `${snRouteTableNamePrivate}-asso`,
//   {
//     subnetId: subnetPrivateProcessing.id,
//     routeTableId: snPrivateRouteTable.id,
//   }
// );

/**
 * 2. ARCHIVING
 */
// Create a ECR container image which is getting used in the fargate task-definition
const containerImage = awsx.ecs.Image.fromPath(
  `${projectName}-ecr`,
  "./req-handler-container"
);

/**
 * 3. CLUSTER
 */

// Create a log group in CloudWatch to accumulate logs
const nameContainerLogGroupReqHandler = `${clusterReqHandlerName}-log-group`;
const containerLogGroupReqHandler = new aws.cloudwatch.LogGroup(
  nameContainerLogGroupReqHandler,
  {
    retentionInDays: 3,
    tags: GetTags(nameContainerLogGroupReqHandler),
  }
);

// Create an application load balancer (ALB) & listener
//  that has a publicly accessible endpoint
//  needed to gain access to the ecs cluster
const albListenerReqHandler = new awsx.lb.ApplicationListener(
  `${clusterReqHandlerName}-alb`,
  { port: albClusterReqHandlerPort }
);

// Create an ECS cluster
const clusterReqHandler = new awsx.ecs.Cluster(clusterReqHandlerName, {
  tags: {
    Name: clusterReqHandlerName,
  },
  vpc: vpc,
});

// Deploy a Fargate Service into the new ECS cluster.
new awsx.ecs.FargateService(clusterReqHandlerName + "-svc", {
  cluster: clusterReqHandler,
  subnets: [subnetPrivateProcessing.id],
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

/**
 * EXPORT INFORMATION
 * - urlAlbReqHandler: This endpoint is needed by the hcs-sys-platform to send requests
 * - gwWireGuardInstancePublicIp: The IP is needed to configure wireguard
 */

// Export the application load balancer's address & gateway ip
export const albHostReqHandler = albListenerReqHandler.endpoint.hostname;
export const natInstancePublicIp = natInstance.publicIp;
