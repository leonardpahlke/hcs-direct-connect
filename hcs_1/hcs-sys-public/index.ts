import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import { projectName, GetTags } from "../../util";

const clusterReqHandlerName = projectName + "-cluster";

/**
 * CONFIGURATION
 */

// Get pulumi configuration to enable dynamic deployments
let config = new pulumi.Config();

// Structured configuration input https://www.pulumi.com/docs/intro/concepts/config/#structured-configuration
interface ConfigData {
  albClusterReqHandlerPort: number;
  clusterReqHandlerDesiredAmount: number;
  clusterReqHandlerMemory: number;
  keyPairName: string;
}

let configData = config.requireObject<ConfigData>("data");
// set config vars
let albClusterReqHandlerPort = configData.albClusterReqHandlerPort || 8000;
let clusterReqHandlerDesiredAmount =
  configData.clusterReqHandlerDesiredAmount || 1;
let clusterReqHandlerMemory = configData.clusterReqHandlerMemory || 128;
let keyPairName = configData.keyPairName || "hcs-gw-key";

/**
 *
 * The file is structured according to the following layout
 * [A]: VPC Network
 * [B]: SecurityGroups
 * [C]: EC2 NAT Gateway server
 * [D]: Network RouteTable set up
 * [E]: Cluster load balancing
 * [F]: Cluster set up
 * [G]: Stack Export Information
 *
 */

/**
 *
 * [A]: VPC NETWORK SETUP
 * 1. VPC which creates a public subnet
 *     a isolated subnet (private after setting route tables)
 *     and a internet gateway
 */
// 1. Create a VPC which hosts most of the services created in this system
const nameVpc = `${projectName}-vpc`;
const subnetPrivateProcessingName = `${nameVpc}-sn-prv`;
const subnetPublicGatewayName = `${nameVpc}-sn-pub`;
const vpcCidr = "10.0.0.0/24";
const vpc = new awsx.ec2.Vpc(nameVpc, {
  cidrBlock: vpcCidr,
  tags: GetTags(nameVpc),
  numberOfAvailabilityZones: 2,
  subnets: [
    { type: "private", name: subnetPrivateProcessingName },
    { type: "public", name: subnetPublicGatewayName },
  ],
});
const subnetPrivateProcessing1 = pulumi.output(vpc.privateSubnets)[0].subnet;
const subnetPrivateProcessing2 = pulumi.output(vpc.privateSubnets)[1].subnet;
const subnetPublicNatGateway1 = pulumi.output(vpc.publicSubnets)[0].subnet;
const subnetPublicNatGateway2 = pulumi.output(vpc.publicSubnets)[1].subnet;

/**
 *
 * [B]: SECURITY GROUPS
 * 1. SecurityGroup to restrict NAT gateway (EC2) access
 * 2. SecurityGroup to restrict fargate access
 */
// 1. Create a security group which is attach to the Gateway Instance and functions as a firewall
const sgNatGwName = `${nameVpc}-sg-nat`;
const natGwSecurityGroup = createSecurityGroup(
  sgNatGwName,
  vpc,
  [
    getDefaultsSGRule({ port: 80, cidrBlocks: [vpcCidr] }),
    getDefaultsSGRule({ protocol: "ICMP" }),
    getDefaultsSGRule({ port: 443, cidrBlocks: [vpcCidr] }),
    getDefaultsSGRule({ port: 22 }),
    getDefaultsSGRule({ port: 51820, protocol: "UDP" }),
  ],
  [
    getDefaultsSGRule({ protocol: "ICMP" }),
    getDefaultsSGRule({ port: 443, cidrBlocks: [vpcCidr] }),
    getDefaultsSGRule({ port: 80 }),
    getDefaultsSGRule({ port: 51820, protocol: "UDP" }),
  ]
);

// 2. Create a security group which is attach to the Fargate service which hosts requestHandler containers
const sgFargateName = `${nameVpc}-sg-fargate`;
const fargateSecurityGroup = createSecurityGroup(
  sgFargateName,
  vpc,
  [
    getDefaultsSGRule({ port: 80 }),
    getDefaultsSGRule({ port: albClusterReqHandlerPort }),
    getDefaultsSGRule({ port: 443 }),
    getDefaultsSGRule({ port: 22 }),
  ],
  [getDefaultsSGRule({ port: 0, protocol: "-1" })]
);

/**
 *
 * [C]: EC2 NAT GATEWAY SERVER
 * 1. Create an ENI (Elastic Natwork Interface)
 * 2. Create an EC2 Instance (NAT Gateway Server)
 */
// 1. Create interface for ec2 gateway instance (AWS Elastic Network Interface (ENI))
const natENIName = `${projectName}-nat-eni`;
const natENI = new aws.ec2.NetworkInterface(natENIName, {
  subnetId: subnetPublicNatGateway1.id,
  securityGroups: [natGwSecurityGroup.securityGroup.id],
  sourceDestCheck: false,
  tags: GetTags(natENIName),
});

// 2. Create EC2 gateway instance which will redirect traffic thorugh a VPN-Tunnel to WireGuard
const size = "t2.micro";
const AmiUbuntuHVM2004 = "ami-05f7491af5eef733a";
const natInstanceName = `${projectName}-nat-instance`;
const natInstance = new aws.ec2.Instance(natInstanceName, {
  ami: AmiUbuntuHVM2004,
  instanceType: size,
  networkInterfaces: [{ networkInterfaceId: natENI.id, deviceIndex: 0 }],
  keyName: keyPairName,
  creditSpecification: { cpuCredits: "unlimited" },
  tags: GetTags(natInstanceName),
});

/**
 *
 * [D]: NETWORK ROUTETABLE SETUP
 * 1. RouteTable to connect private and public subnet
 */

// 12. Create a RouteTable to redirect traffic from the private-subnet to the nat gateway server (EC2 Instance)
// const snRouteTableNamePrivate = `${subnetPrivateProcessingName}-rt`;
// const privateProcessingRouteTable = aws.ec2.getRouteTable({
//   subnetId: pulumi.all([subnetPrivateProcessing1.id]).apply(([snId]) => `${snId}`),
// });
// new aws.ec2.Route(snRouteTableNamePrivate, {
//   routeTableId: privateProcessingRouteTable.then((table) => table.id),
//   destinationCidrBlock: "0.0.0.0/0",
//   instanceId: natInstance.id,
// });
// const snPrivateRouteTable = new aws.ec2.RouteTable(snRouteTableNamePrivate, {
//   vpcId: vpc.id,
//   routes: [{ cidrBlock: "0.0.0.0/0", instanceId: natInstance.id }],
//   tags: GetTags(snRouteTableNamePrivate),
// });
// new aws.ec2.RouteTableAssociation(`${snRouteTableNamePrivate}-asso`, {
//   subnetId: subnetPrivateProcessing1.id,
//   routeTableId: snPrivateRouteTable.id,
// });
// aws.ec2.MainRouteTableAssociation()

/**
 *
 * [E]: CLUSTER LOADBALANCER
 * 1. Application Load Balancer (ALB)
 * 2. Listener (for ALB)
 */
// 1. Create an application load balancer (ALB) & listener
//    that has a publicly accessible endpoint needed to gain access to the ecs cluster
const albListenerReqHandlerName = `${clusterReqHandlerName}-alb`;
const albListenerReqHandler = new awsx.lb.ApplicationListener(
  albListenerReqHandlerName,
  { port: albClusterReqHandlerPort, vpc: vpc, name: albListenerReqHandlerName }
);

/**
 *
 * [F]: CLUSTER
 * 1. ECS Cluster
 * 2. Container TaskDefinition
 * 3. FargateService Definition
 */
// 1. ECS Cluster which is used to register fargate service configurations
const clusterReqHandler = new awsx.ecs.Cluster(clusterReqHandlerName, {
  name: clusterReqHandlerName,
  vpc: vpc,
  securityGroups: [fargateSecurityGroup.id],
  tags: { Name: clusterReqHandlerName },
});

// 3. FaragateService Definition which registers a service exec to the ECS Cluster
const fargateServiceName = `${clusterReqHandlerName}-svc`;
new awsx.ecs.FargateService(fargateServiceName, {
  name: fargateServiceName,
  desiredCount: clusterReqHandlerDesiredAmount,
  cluster: clusterReqHandler,
  assignPublicIp: false,
  subnets: [subnetPrivateProcessing1.id],
  waitForSteadyState: true,
  taskDefinitionArgs: {
    containers: {
      requetHandler: {
        image: awsx.ecs.Image.fromPath(
          `${projectName}-ecr`,
          "./req-handler-container"
        ),
        memory: clusterReqHandlerMemory,
        portMappings: [albListenerReqHandler],
      },
    },
  },
  tags: GetTags(fargateServiceName),
});

/**
 *
 * [G]: EXPORT INFORMATION
 * - albHostReqHandler: This endpoint is needed by the hcs-sys-platform to send requests
 * - natInstancePublicIp: The IP is needed to configure wireguard
 */
export const albHostReqHandler = albListenerReqHandler.endpoint.hostname;
export const natInstancePublicIp = natInstance.publicIp;

/**
 *
 *
 * ******************************
 * HELPER FUNCTIONS & INTERFACES
 * 1. Simplify how to create security groups in pulumi
 *
 */

// ******************************
// 1. SIMPLIFY HOW TO CREATE SECURITY GROUPS IN PULUMI

// This interface is used to specify ingress and egress securitygroup rules
interface sgRule {
  description: string;
  fromPort: number;
  toPort: number;
  protocol: string;
  cidrBlocks: string[];
}

// This interface is used to simplify the definition of security group rules via the method getDefaultsSGRule/1
interface sgRuleDefault {
  description?: string;
  port?: number;
  protocol?: string;
  cidrBlocks?: string[];
}

// This function is used to simplify the creation of a security group
function createSecurityGroup(
  name: string,
  vpc: awsx.ec2.Vpc,
  ingressRules: sgRule[],
  egressRules: sgRule[]
): awsx.ec2.SecurityGroup {
  return new awsx.ec2.SecurityGroup(name, {
    vpc: vpc,
    ingress: ingressRules,
    egress: egressRules,
    tags: GetTags(name),
  });
}

// This function is used to simplfy the creation of security group rules
function getDefaultsSGRule(sgRuleDefault?: sgRuleDefault): sgRule {
  let description = "";
  let port = -1;
  let protocol = "TCP";
  let cidrBlocks = ["0.0.0.0/0"];
  // overwrite defaults if they are defined
  if (sgRuleDefault != undefined) {
    // overwrite description
    if (sgRuleDefault.description != undefined) {
      description = sgRuleDefault.description;
    }
    // overwrite port
    if (sgRuleDefault.port != undefined) {
      port = sgRuleDefault.port;
    }
    // overwrite protocol
    if (sgRuleDefault.protocol != undefined) {
      protocol = sgRuleDefault.protocol;
    }
    // overwrite cidrBlocks
    if (sgRuleDefault.cidrBlocks != undefined) {
      cidrBlocks = sgRuleDefault.cidrBlocks;
    }
  }
  // Return a sgRule interface which can be used to define ingress & egress security group rules
  return {
    description: description,
    fromPort: port,
    toPort: port,
    protocol: protocol,
    cidrBlocks: cidrBlocks,
  };
}
