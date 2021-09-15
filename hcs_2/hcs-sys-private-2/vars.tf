# Set default digital ocean region to deploy to
#  see: https://docs.digitalocean.com/products/platform/availability-matrix/
variable "region" {
  description = "Digital Ocean region"
  type        = string
  default     = "fra1"
}
# Set default machine-image that is getting used for the vm
#  see: https://docs.digitalocean.com/products/droplets/
variable "vm_image" {
  description = "Virtual Machine Image"
  type        = string
  default     = "ubuntu-20-04-x64"
  #"debian-9-x64"
}
# Set default resource specification for vm
#  see: https://developers.digitalocean.com/documentation/v2/#list-all-sizes
variable "vm_resources" {
  description = "Virtual Machine resource specification"
  type        = string
  default     = "s-1vcpu-1gb"
}
variable "vpc_cidr" {
  description = "VPC Cidr range"
  type        = string
  default     = "10.194.0.0/20"
}
