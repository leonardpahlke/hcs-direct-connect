import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import { projectName, GetTags } from "../../util";

const clusterReqHandlerName = projectName + "-cluster-req-han";

/**
 * CONFIGURATION
 */

// Get pulumi configuration to enable dynamic deployments
const http = "HTTP";
let config = new pulumi.Config();

// Structured configuration input https://www.pulumi.com/docs/intro/concepts/config/#structured-configuration
interface ConfigData {
  albClusterReqHandlerPort: number;
  clusterReqHandlerDesiredAmount: number;
  clusterReqHandlerMemory: number;
  keyPairName: string;
  dockerImage: string;
}

let configData = config.requireObject<ConfigData>("data");
// set config vars
let albClusterReqHandlerPort = configData.albClusterReqHandlerPort || 8000;
let clusterReqHandlerDesiredAmount =
  configData.clusterReqHandlerDesiredAmount || 1;
let clusterReqHandlerMemory = configData.clusterReqHandlerMemory || 128;
let keyPairName = configData.keyPairName || "hcs-gw-key";
let dockerImage = configData.dockerImage || "leonardpahlke/hcs_req_handler";

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
 * 1. VPC
 * 2. Private Subnet
 * 3. Public Subnet
 * 4. Internet Gateway
 */
// 1. Create a VPC which hosts most of the services created in this system
const nameVpc = `${projectName}-vpc`;
const vpc = new aws.ec2.Vpc(nameVpc, {
  cidrBlock: "10.0.0.0/24",
  tags: GetTags(nameVpc),
});

// 2. Create the subnet private processing
//   After more configuration is done.. this subnet does not have direct access
//    to the internet and routes all outbound traffic over the NAT GW Server
const subnetPrivateProcessingName = `${nameVpc}-sn-prv`;
const subnetPrivateProcessingCidr = "10.0.0.16/28";
const subnetPrivateProcessing = new aws.ec2.Subnet(
  subnetPrivateProcessingName,
  {
    vpcId: vpc.id,
    cidrBlock: subnetPrivateProcessingCidr,
    tags: GetTags(subnetPrivateProcessingName),
  }
);

// 3. Create the subnet public gateway
//   After more configuration is done.. this subnet
//    has internet access and hosts a EC2 NAT GW Intance
const subnetPublicGatewayName = `${nameVpc}-sn-pub`;
const subnetPublicGatewayCidr = "10.0.0.144/28";
const subnetPublicNatGateway = new aws.ec2.Subnet(subnetPublicGatewayName, {
  vpcId: vpc.id,
  cidrBlock: subnetPublicGatewayCidr,
  mapPublicIpOnLaunch: true,
  tags: GetTags(subnetPublicGatewayName),
});

// 4. Create a internet gateway and attach it to the VPC to get internet access
const internetGatewayName = `${nameVpc}-igw`;
const igw = new aws.ec2.InternetGateway(internetGatewayName, {
  vpcId: vpc.id,
  tags: GetTags(internetGatewayName),
});

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
    getDefaultsSGRule({ port: 80, cidrBlocks: [subnetPrivateProcessingCidr] }),
    getDefaultsSGRule({ protocol: "ICMP" }),
    getDefaultsSGRule({ port: 443, cidrBlocks: [subnetPrivateProcessingCidr] }),
    getDefaultsSGRule({ port: 22 }),
    getDefaultsSGRule({ port: 51820, protocol: "UDP" }),
  ],
  [
    getDefaultsSGRule({ protocol: "ICMP" }),
    getDefaultsSGRule({ port: 443, cidrBlocks: [subnetPrivateProcessingCidr] }),
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
    getDefaultsSGRule({ port: 443 }),
    getDefaultsSGRule({ port: 22 }),
  ],
  [
    getDefaultsSGRule({ protocol: "TCP" }),
    getDefaultsSGRule({ protocol: "ICMP" }),
    getDefaultsSGRule({ protocol: "UDP" }),
  ]
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
  subnetId: subnetPublicNatGateway.id,
  securityGroups: [natGwSecurityGroup.id],
  sourceDestCheck: false,
  tags: GetTags(natENIName),
});

// 2. Create EC2 gateway instance which will redirect traffic thorugh a VPN-Tunnel to WireGuard
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
  tags: GetTags(natInstanceName),
});

/**
 *
 * [D]: NETWORK ROUTETABLE SETUP
 * 1. RouteTable to connect public subnet to the internet
 * 2. RouteTable to connect private and public subnet
 */
// 1. Create a RouteTable to redirect traffic from the public-subnet to an interet gateway
const snRouteTableNamePublic = `${subnetPublicGatewayName}-rt`;
const snPublicRouteTable = new aws.ec2.RouteTable(snRouteTableNamePublic, {
  vpcId: vpc.id,
  routes: [{ cidrBlock: "0.0.0.0/0", gatewayId: igw.id }],
  tags: GetTags(snRouteTableNamePublic),
});
new aws.ec2.RouteTableAssociation(`${snRouteTableNamePublic}-asso`, {
  subnetId: subnetPublicNatGateway.id,
  routeTableId: snPublicRouteTable.id,
});

// 2. Create a RouteTable to redirect traffic from the private-subnet to the nat gateway server (EC2 Instance)
const snRouteTableNamePrivate = `${subnetPrivateProcessingName}-rt`;
const snPrivateRouteTable = new aws.ec2.RouteTable(snRouteTableNamePrivate, {
  vpcId: vpc.id,
  routes: [{ cidrBlock: "0.0.0.0/0", instanceId: natInstance.id }],
  tags: GetTags(snRouteTableNamePrivate),
});
new aws.ec2.RouteTableAssociation(`${snRouteTableNamePrivate}-asso`, {
  subnetId: subnetPrivateProcessing.id,
  routeTableId: snPrivateRouteTable.id,
});

/**
 *
 * [E]: CLUSTER LOADBALANCER
 * 1. Application Load Balancer (ALB)
 * 2. Listener (for ALB)
 */
// 1. Create an application load balancer (ALB) & listener
//    that has a publicly accessible endpoint needed to gain access to the ecs cluster
const albListenerReqHandler = new awsx.lb.ApplicationListener(
  `${clusterReqHandlerName}-alb`,
  { port: albClusterReqHandlerPort }
);

const albTgName = `${projectName}-tg`;
const albTg = new aws.lb.TargetGroup(albTgName, {
  name: albTgName,
  port: albClusterReqHandlerPort,
  protocol: http,
  vpcId: vpc.id,
  targetType: "ip",
  tags: GetTags(albTgName),
});

const albName = `${projectName}-alb`;
const alb = new aws.lb.LoadBalancer(albName, {
  name: albName,
  tags: GetTags(albTgName),
});

const albListenerName = `${albName}-listener`;
const albListener = new aws.lb.Listener(albListenerName, {
  loadBalancerArn: alb.arn,
  port: albClusterReqHandlerPort,
  protocol: http,
  defaultActions: [
    {
      type: "forward",
      targetGroupArn: albTg.arn,
    },
  ],
});

/**
 *
 * [F]: CLUSTER
 * 1. ECS Cluster
 * 2. Container TaskDefinition
 * 3. FargateService Definition
 */
// 1. ECS Cluster which is used to register fargate service configurations
const clusterReqHandler = new aws.ecs.Cluster(clusterReqHandlerName, {
  tags: { Name: clusterReqHandlerName },
});

// 2. TaskDefinition which describes how the requestHanlder container should get run on fargate
const reqHandlerTaskDefinitionName = clusterReqHandlerName + "td";
const reqHandlerTaskDefinition = new aws.ecs.TaskDefinition(
  `${clusterReqHandlerName}-td`,
  {
    family: reqHandlerTaskDefinitionName,
    requiresCompatibilities: ["FARGATE"],
    containerDefinitions: JSON.stringify([
      {
        name: "reqHandler",
        image: dockerImage,
        essential: true,
        portMappings: [{ containerPort: albClusterReqHandlerPort }],
      },
    ]),
    cpu: "10",
    memory: `${clusterReqHandlerMemory}`,
    networkMode: "awsvpc",
    tags: GetTags(reqHandlerTaskDefinitionName),
  }
);

// 3. FaragateService Definition which registers a service exec to the ECS Cluster
new aws.ecs.Service(`${clusterReqHandlerName}-svc`, {
  cluster: clusterReqHandler.arn,
  taskDefinition: reqHandlerTaskDefinition.arn,
  networkConfiguration: {
    subnets: [subnetPrivateProcessing.id],
    securityGroups: [fargateSecurityGroup.id],
  },
  desiredCount: clusterReqHandlerDesiredAmount,
  waitForSteadyState: true,
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
// This function is used to simplify the creation of a security group
function createSecurityGroup(
  name: string,
  vpc: aws.ec2.Vpc,
  ingressRules: sgRule[],
  egressRules: sgRule[],
  description = ""
): aws.ec2.SecurityGroup {
  return new aws.ec2.SecurityGroup(name, {
    description: description,
    vpcId: vpc.id,
    ingress: ingressRules,
    egress: egressRules,
    tags: GetTags(name),
  });
}

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
