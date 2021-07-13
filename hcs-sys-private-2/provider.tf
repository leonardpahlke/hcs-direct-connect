# Set digital ocean as provider
terraform {
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "1.22.2"
    }
  }
}

# Specify api access token
provider "digitalocean" {
  token = var.do_token
}

# Referece created digital ocean ssh key by name
data "digitalocean_ssh_key" "id_rsa_hcs" {
  name = "id_rsa_hcs"
}
