# * * * * * * * * * * * * * * * * * * * *
# VIRTUAL PRIVATE NETWORK
# DOC: https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs/resources/vpc
resource "digitalocean_vpc" "vpc" {
  name     = "hcs-vpc"
  region   = var.region
  ip_range = var.vpc_cidr
}

# * * * * * * * * * * * * * * * * * * * *
# DROPLET, VM INSTANCE
# DOC: https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs/resources/droplet
# FLOATING PUBLIC IP
resource "digitalocean_floating_ip" "hcs_floating_ip" {
  region = var.region
}
resource "digitalocean_droplet" "legacy_vm" {
  image              = var.vm_image
  name               = "hcs-legacy-vm"
  region             = var.region
  size               = var.vm_resources
  private_networking = true
  ssh_keys           = [data.digitalocean_ssh_key.id_rsa_hcs.id]
  depends_on = [
    digitalocean_floating_ip.hcs_floating_ip
  ]
}

resource "digitalocean_floating_ip_assignment" "hcs_floating_ip_asignment" {
  ip_address = digitalocean_floating_ip.hcs_floating_ip.ip_address
  droplet_id = digitalocean_droplet.legacy_vm.id
}

# * * * * * * * * * * * * * * * * * * * *
# FIREWALL
# DOC: https://registry.terraform.io/providers/digitalocean/digitalocean/latest/docs/resources/firewall
resource "digitalocean_firewall" "legacy_vm_firewall" {
  name        = "hcs-legacy-vm-fw"
  droplet_ids = [digitalocean_droplet.legacy_vm.id]
  # Inbound rules
  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }
  inbound_rule {
    protocol         = "tcp"
    port_range       = "80"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }
  inbound_rule {
    protocol         = "tcp"
    port_range       = "443"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }
  inbound_rule {
    protocol         = "icmp"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }
  inbound_rule {
    protocol         = "udp"
    port_range       = "500"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }
  inbound_rule {
    protocol         = "udp"
    port_range       = "53"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }
  # Outbound rules
  outbound_rule {
    protocol              = "tcp"
    port_range            = "80"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
  outbound_rule {
    protocol              = "tcp"
    port_range            = "443"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
  outbound_rule {
    protocol              = "udp"
    port_range            = "53"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
  outbound_rule {
    protocol              = "udp"
    port_range            = "500"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}

# * * * * * * * * * * * * * * * * * * * *
# TERRAFORM OUTPUTS
output "instance_ipv4" {
  value = digitalocean_droplet.legacy_vm.ipv4_address
}
output "floating_ipv4" {
  value = digitalocean_floating_ip_assignment.hcs_floating_ip_asignment.ip_address
}
output "vpc_cidr" {
  value = var.vpc_cidr
}



# echo "2.2. Add a next-hop route through the VPN gateway"
# gcloud compute --project=$ONPREM_PROJECT routes create route-to-gcp-apis \
#     --network=$ONPREM_VPC --priority=1000 \
#     --destination-range=$GCP_API_CIDR --next-hop-instance=$ONPREM_INSTANCE_VPN_GATEWAY \
#     --next-hop-instance-zone=$ONPREM_REGION

# echo "2.3. Create a VM for testing"
# ONPREM_INSTANCE_TEST=instance-test-on-prem

# gcloud compute --project=$ONPREM_PROJECT instances create $ONPREM_INSTANCE_TEST \
#     --zone=$ONPREM_REGION --machine-type=n1-standard-1 \
#     --subnet=$ONPREM_SUBNET --can-ip-forward --no-service-account --no-scopes  \
#     --image-family=debian-9 \
#     --image-project=debian-cloud --boot-disk-size=10GB \
#     --boot-disk-type=pd-standard --boot-disk-device-name=$ONPREM_INSTANCE_TEST

# echo "2.4. Obtain, and make a note of, the public and private IP addresses of the VPN gateway (instance-vpn-gateway-on-prem):"
# gcloud compute instances list --project $ONPREM_PROJECT
