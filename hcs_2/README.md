# HCS-DIRECT-CONNECT-2

Under this folder both the public cloud and the private cloud system is configured.
Both systems are part of the HCS-DIRECT-CONNECT-2 hybrid cloud automation strategy system.

- The public cloud is deployed on GCP and uses the IaC tool Pulumi, written in GO.
- The private cloud system is deployed on DigitalOcean and uses the IaC tool Terraform, written in HCL.

The diagram below highlights the system that is getting deployed.

![Software Architecture](./assets/ba-06-verteilungssicht.png)

To deploy the system the you can use the 'proivsion_hcs.py' script one directory above this one.
To automate the deployment process python classes have been defined (see 'abc_provision.py', 'provision_hcs_priv.py', 'provision_hcs_pub.py').
The structure is shown in the diagram below.

![Deployment classes](./assets/ba-06-automatisierung-aufbau.png)

## Additional information for HCS-SYS-PRIVATE

The terraform file `protected_vars.tf` is not getting pushed to version control and needs to be created manually. Example is shown below.

```tf
variable "do_token" {
  description = "Digital Ocean token"
  type        = string
  default     = "AAABBBCCC"
}
variable "pvt_key" {
  description = "SSH Key path"
  type        = string
  default     = "~/.ssh/id_rsa"
}
```

- Check terraform template `terraform plan -out tf_out.json`
- Create resources in digital ocean `terraform apply -out tf_out.json`
- SHH into VM with `ssh -i ~/.ssh/id_rsa` root@0.0.0.0/0
- Destroy resources in digital ocean `terraform destroy`
