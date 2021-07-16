package main

import (
	"fmt"

	"github.com/pulumi/pulumi-gcp/sdk/v5/go/gcp/compute"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi/config"
)

// * * * * * * * * * * * * * * * * * * * * * * * *
// VARIRABLES
const INTERNAL_PROJECT_NAME = "hcs"
const DEPLOY_ENV = "dev"

// GCP project settings
const PROJECT_NAME_GCP = "hcs-sys-direct-connect"
const PROJECT_GCP_ZONE = "europe-west3-a"
const PROJECT_GCP_REGION = "europe-west3"
const PROJECT_GCP_BUCKET_REGION = "EU"

// VPC Network settings
// const VPC_SUBNET_CIDR = "10.10.0.0/20"
// const API_CIDR = "199.36.153.4/30"

// VM settings
const VM_MACHINE_IMAGE = "debian-cloud/debian-9" // "ubuntu-os-cloud/ubuntu-2104"
const VM_MACHINE_TYPE = "f1-micro"
const VM_DISK_SIZE_GB = 10

// const ONPREM_SUBNET_CIDR = "192.168.0.0/20"
// const ONPREM_PEER_IP = "15.0.0.120"
// const VPN_SHARED_SECRET = "SECRET_MESSAGE"

// Firewall vars
const _DIRECTION_INGRESS string = "INGRESS"
const _DIRECTION_EGRESS string = "EGRESS"
const _FULL_CIDR_IPV4 string = "0.0.0.0/0"
const _FULL_CIDR_IPV6 string = "::/0"
const _TCP string = "tcp"
const _UDP string = "udp"
const _ICMP string = "icmp"

type FirewallConfig struct {
	name              string
	firewallAllowAry  compute.FirewallAllowArray
	destinationRanges pulumi.StringArray
	direction         string
	sourceRanges      pulumi.StringArray
	description       string
}

// Forwarding Rule config
type ForwardingRuleConfig struct {
	name       string
	ipProtocol string
	portRange  string
}

// * * * * * * * * * * * * * * * * * * * * * * * *
// PULUMI CONFIG EXAMPLE:
//  OnpremPeerIp 		to: 138.68.124.156
//  OnpremSubnetCidr    to: 10.114.0.0/20
//  OnpremSharedSecret  to: SHARED_SECRET
//  GcpVmReqHandlerPort to: 8000
//  GcpVpcSubnetCidr    to: 10.10.0.0/20
//  GcpApiCidr 		    to: 199.36.153.4/30
type Data struct {
	OnpremPeerIp        string
	OnpremSubnetCidr    string
	OnpremSharedSecret  string
	GcpVmReqHandlerPort int
	GcpVpcSubnetCidr    string
	GcpApiCidr          string
}

// * * * * * * * * * * * * * * * * * * * * * * * *
// MAIN FUNCTION WHICH HOLDS THE PULUMI GCP-SERVICE CONFIGURATION
func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {

		// Load pulumi configuration into struct
		var conf Data
		cfg := config.New(ctx, "")
		cfg.RequireObject("data", &conf)

		// * * * * * * * * * * * * * * * * * * * * * * * *
		// VPC NETWORK
		hcsVpc, err := compute.NewNetwork(ctx, createName("vpc"), &compute.NetworkArgs{
			AutoCreateSubnetworks: pulumi.Bool(false),
			Project:               pulumi.String(PROJECT_NAME_GCP),
		})
		if err != nil {
			return err
		}

		// Private Subnet which has not internet access
		var hcsSnName = createName("sn-vpn")
		hcsSN, err := compute.NewSubnetwork(ctx, hcsSnName, &compute.SubnetworkArgs{
			IpCidrRange:           pulumi.String(conf.GcpVpcSubnetCidr),
			Name:                  pulumi.String(hcsSnName),
			Network:               hcsVpc.Name,
			PrivateIpGoogleAccess: pulumi.Bool(true), // When enabled, VMs in this subnetwork without external IP addresses can access Google APIs and services by using Private Google Access.
			Project:               pulumi.String(PROJECT_NAME_GCP),
			Region:                pulumi.String(PROJECT_GCP_REGION),
		})
		if err != nil {
			return err
		}

		// Create a route in public subnet to access the internet
		var routeIgwName = createName("route-igw")
		_, err = compute.NewRoute(ctx, routeIgwName, &compute.RouteArgs{
			DestRange:      pulumi.String(conf.GcpApiCidr),
			Name:           pulumi.String(routeIgwName),
			Network:        hcsVpc.Name,
			NextHopGateway: pulumi.String("default-internet-gateway"),
			Priority:       pulumi.Int(100),
			Project:        pulumi.String(PROJECT_NAME_GCP),
			Tags:           createTags(routeIgwName),
		})
		if err != nil {
			return err
		}

		// * * * * * * * * * * * * * * * * * * * * * * * *
		// VM, NAT-GATEWAY INSTANCE
		var hcsGwVmName = createName("vm-req-han")
		hcsRequestHandlerVm, err := compute.NewInstance(ctx, hcsGwVmName, &compute.InstanceArgs{
			Project:      pulumi.String(PROJECT_NAME_GCP),
			Name:         pulumi.String(hcsGwVmName),
			Tags:         createTags(hcsGwVmName),
			Zone:         pulumi.String(PROJECT_GCP_ZONE),
			MachineType:  pulumi.String(VM_MACHINE_TYPE),
			CanIpForward: pulumi.Bool(true), // Whether to allow sending and receiving of packets with non-matching source or destination IPs
			BootDisk: &compute.InstanceBootDiskArgs{
				DeviceName: pulumi.String(hcsGwVmName),
				InitializeParams: &compute.InstanceBootDiskInitializeParamsArgs{
					Image: pulumi.String(VM_MACHINE_IMAGE), // The image from which to initialize this disk
					Size:  pulumi.Int(VM_DISK_SIZE_GB),     // The size of the image in gigabytes.
					Type:  pulumi.String("pd-standard"),    // The accelerator type resource to expose to this instance.
				},
			},
			NetworkInterfaces: compute.InstanceNetworkInterfaceArray{&compute.InstanceNetworkInterfaceArgs{
				AccessConfigs: compute.InstanceNetworkInterfaceAccessConfigArray{},
				Subnetwork:    hcsSN.ID(),
			}},
		})

		// * * * * * * * * * * * * * * * * * * * * * * * *
		// NETWORK FIREWALL
		for _, e := range []FirewallConfig{
			// Allow inbound HTTP, HTTPS and SSH traffic
			// {
			// 	name: "ig-plat",
			// 	firewallAllowAry: compute.FirewallAllowArray{
			// 		compute.FirewallAllowArgs{
			// 			Protocol: pulumi.String(TCP),
			// 			Ports: pulumi.StringArray{
			// 				pulumi.String(fmt.Sprintf("%v", conf.GcpVmReqHandlerPort)),
			// 				pulumi.String("80"),
			// 				pulumi.String("443"),
			// 				pulumi.String("22"),
			// 			},
			// 		}},
			// 	destinationRanges: pulumi.StringArray{pulumi.String(conf.GcpVpcSubnetCidr)},
			// 	direction:         _DIRECTION_INGRESS,
			// 	//sourceRanges:      pulumi.StringArray{pulumi.String(_FULL_CIDR_IPV4), pulumi.String(_FULL_CIDR_IPV6)},
			// 	description: "Allow inbound traffic on HTTP and SSH ports from everywhere",
			// },
			// Allow inbound VPN Traffic
			{
				name: "ig-vpn",
				firewallAllowAry: compute.FirewallAllowArray{
					compute.FirewallAllowArgs{Protocol: pulumi.String(_TCP)},
					compute.FirewallAllowArgs{Protocol: pulumi.String(_UDP)},
					compute.FirewallAllowArgs{Protocol: pulumi.String(_ICMP)},
				},
				//destinationRanges: pulumi.StringArray{pulumi.String(conf.GcpVpcSubnetCidr)},
				//sourceRanges:      pulumi.StringArray{pulumi.String(conf.OnpremSubnetCidr)},
				direction:   _DIRECTION_INGRESS,
				description: "Allow inbound vpn TCP, UDP and ICMP traffic from VPN source",
			},
			// Allow all outbound Traffic
			{
				name: "eg-all",
				firewallAllowAry: compute.FirewallAllowArray{
					compute.FirewallAllowArgs{Protocol: pulumi.String(_TCP)},
					compute.FirewallAllowArgs{Protocol: pulumi.String(_UDP)},
					compute.FirewallAllowArgs{Protocol: pulumi.String(_ICMP)},
				},
				//destinationRanges: pulumi.StringArray{pulumi.String(_FULL_CIDR_IPV4), pulumi.String(_FULL_CIDR_IPV6)},
				direction: _DIRECTION_EGRESS,
				//sourceRanges: pulumi.StringArray{pulumi.String(conf.GcpVpcSubnetCidr)},
				description: "Allow all outbound traffic",
			},
		} {
			_, err = compute.NewFirewall(ctx, createName(e.name), &compute.FirewallArgs{
				Project:           pulumi.String(PROJECT_NAME_GCP),
				Network:           hcsVpc.Name,
				Description:       pulumi.String(e.description),
				Allows:            e.firewallAllowAry,         // The list of ALLOW rules specified by this firewall.
				DestinationRanges: e.destinationRanges,        // If destination ranges are specified, the firewall will apply only to traffic that has destination IP address in these ranges.
				SourceRanges:      e.sourceRanges,             // If source ranges are specified, the firewall will apply only to traffic that has source IP address in these ranges.
				Direction:         pulumi.String(e.direction), // Direction of traffic to which this firewall applies; default is INGRESS.
			})
			if err != nil {
				return err
			}
		}

		// * * * * * * * * * * * * * * * * * * * * * * * *
		// VPN-GATEWAY
		var hcsVpnGatewayName = createName("vpn-gw")
		hcsVpnGateway, err := compute.NewVPNGateway(ctx, hcsVpnGatewayName, &compute.VPNGatewayArgs{
			Project: pulumi.String(PROJECT_NAME_GCP),
			Name:    pulumi.String(hcsVpnGatewayName),
			Network: hcsVpc.ID(),
			Region:  pulumi.String(PROJECT_GCP_REGION),
		})
		if err != nil {
			return err
		}
		// Create a static ip for the vpn tunnel
		const hcsVpnStaticIpName = "vpnstaticip"
		hcsVpnStaticIp, err := compute.NewAddress(ctx, hcsVpnStaticIpName, &compute.AddressArgs{
			Name:    pulumi.String(hcsVpnStaticIpName),
			Project: pulumi.String(PROJECT_NAME_GCP),
			Region:  pulumi.String(PROJECT_GCP_REGION),
		})
		if err != nil {
			return err
		}

		// Create Forwarding rules
		var forwardingRules []pulumi.Resource
		for _, e := range []ForwardingRuleConfig{
			{name: "fr-esp", ipProtocol: "ESP"},
			{name: "fr-udp-500", ipProtocol: "UDP", portRange: "500"},
			{name: "fr-udp-4500", ipProtocol: "UDP", portRange: "4500"},
		} {
			fwdRule, err := compute.NewForwardingRule(ctx, createName(e.name), &compute.ForwardingRuleArgs{
				IpProtocol: pulumi.String(e.ipProtocol),
				PortRange:  pulumi.String(e.portRange),
				IpAddress:  hcsVpnStaticIp.Address,
				Target:     hcsVpnGateway.ID(),
			})
			if err != nil {
				return err
			}
			forwardingRules = append(forwardingRules, fwdRule)
		}

		// frEsp, err := compute.NewForwardingRule(ctx, createName("fr-esp"), &compute.ForwardingRuleArgs{
		// 	IpProtocol: pulumi.String("ESP"),
		// 	IpAddress:  hcsVpnStaticIp.Address,
		// 	Region:     pulumi.String(PROJECT_GCP_REGION),
		// 	Target:     hcsVpnGateway.ID(),
		// })
		// if err != nil {
		// 	return err
		// }
		// frUdp500, err := compute.NewForwardingRule(ctx, createName("fr-udp-500"), &compute.ForwardingRuleArgs{
		// 	IpProtocol: pulumi.String("UDP"),
		// 	PortRange:  pulumi.String("500"),
		// 	IpAddress:  hcsVpnStaticIp.Address,
		// 	Region:     pulumi.String(PROJECT_GCP_REGION),
		// 	Target:     hcsVpnGateway.ID(),
		// })
		// if err != nil {
		// 	return err
		// }
		// frUdp4500, err := compute.NewForwardingRule(ctx, createName("fr-udp-4500"), &compute.ForwardingRuleArgs{
		// 	IpProtocol: pulumi.String("UDP"),
		// 	PortRange:  pulumi.String("4500"),
		// 	IpAddress:  hcsVpnStaticIp.Address,
		// 	Region:     pulumi.String(PROJECT_GCP_REGION),
		// 	Target:     hcsVpnGateway.ID(),
		// })
		// if err != nil {
		// 	return err
		// }

		// * * * * * * * * * * * * * * * * * * * * * * * *
		// VPN-TUNNEL
		var hcsVpnTunnelName = createName("vpn-tunnel")
		hcsVpnTunnel, err := compute.NewVPNTunnel(ctx, hcsVpnTunnelName, &compute.VPNTunnelArgs{
			IkeVersion:             pulumi.Int(2),
			Name:                   pulumi.String(hcsVpnTunnelName),
			PeerIp:                 pulumi.String(conf.OnpremPeerIp),
			Project:                pulumi.String(PROJECT_NAME_GCP),
			Region:                 pulumi.String(PROJECT_GCP_REGION),
			RemoteTrafficSelectors: pulumi.StringArray{pulumi.String(conf.OnpremSubnetCidr)},
			SharedSecret:           pulumi.String(conf.OnpremSharedSecret),
		}, pulumi.DependsOn(
			forwardingRules,
		// 	[]pulumi.Resource{
		// 	frEsp,
		// 	frUdp500,
		// 	frUdp4500,
		// },
		))
		if err != nil {
			return err
		}
		var routeOnPremName = createName("route-onprem")
		_, err = compute.NewRoute(ctx, routeOnPremName, &compute.RouteArgs{
			DestRange:        pulumi.String(conf.OnpremSubnetCidr),
			Name:             pulumi.String(routeOnPremName),
			Network:          hcsVpc.Name,
			NextHopVpnTunnel: hcsVpnTunnel.ID(),
			Priority:         pulumi.Int(1000),
			Project:          pulumi.String(PROJECT_NAME_GCP),
			Tags:             createTags(routeOnPremName),
		})
		if err != nil {
			return err
		}

		// * * * * * * * * * * * * * * * * * * * * * * * *
		// SET PULUMI OUTPUTS
		ctx.Export("instance_name", hcsRequestHandlerVm.Name)
		ctx.Export("tunnel_ip", hcsVpnStaticIp.Address)
		ctx.Export("instance_zone", pulumi.String(PROJECT_GCP_ZONE))
		ctx.Export("project_name", pulumi.String(PROJECT_NAME_GCP))

		return nil
	})
}

// * * * * * * * * * * * * * * * * * * * * * * * *
// ADDITIONAL FUNCTIONS

// createName/2: use this function to name service created
//  @gcpServiceName: name of the gcp service     (e.g. cloudrun)
//  @serviceName   : name of service you created (e.g. reqhandler)
func createName(serviceName string) string {
	return fmt.Sprintf("%s-%s-%s-%s", INTERNAL_PROJECT_NAME, DEPLOY_ENV, PROJECT_GCP_ZONE, serviceName)
}

// createTags/1: use this function to create tags for services created
//  @resourceName: name of service you created     (e.g. reqhandler)
func createTags(resourceName string) pulumi.StringArrayInput {
	return pulumi.StringArray{
		pulumi.String(DEPLOY_ENV),
		pulumi.String(resourceName),
		pulumi.String("pulumi"),
		pulumi.String(INTERNAL_PROJECT_NAME),
	}
}
