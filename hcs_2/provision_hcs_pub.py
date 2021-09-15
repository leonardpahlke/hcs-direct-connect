import logging
import hcs_2.abc_provisioner as provisioner


class InProvisionerPub2:
    # @onpremPeerIp:        Public IPv4 adress of the vpn tunnel hosted on the on premise gateway vm
    # @onpremSubnetCidr:    Network cidr range that is used for on prem services
    # @onpremSharedSecret:  VPN Tunnel shared secret (used by strongswarn)
    # @gcpVmReqHandlerPort: request handler container port, that is used to receive traffic
    # @gcpVpcSubnetCidr:    GCP VPC CIDR
    # @gcpApiCidr:          GCP API CIDR
    def __init__(self,
                 on_prem_peer_ip=None,
                 on_prem_subnet_cidr="10.194.0.0/20",
                 on_prem_shared_secret=None,
                 gcp_vm_req_handler_port="8000",
                 gcp_vpc_subnet_cidr="10.10.0.0/20",
                 gcp_api_cidr="199.36.153.4/30"
                 ) -> None:
        if on_prem_peer_ip is None or on_prem_shared_secret is None:
            raise SystemExit(
                "Not enough arguments supplied; on_prem_peer_ip and on_premSharedSecret has to be set, cannot use defaults, exit")
        self.on_prem_peer_ip = on_prem_peer_ip
        self.on_prem_subnet_cidr = on_prem_subnet_cidr
        self.on_prem_shared_secret = on_prem_shared_secret
        self.gcp_vm_req_handler_port = gcp_vm_req_handler_port
        self.gcp_vpc_subnet_cidr = gcp_vpc_subnet_cidr
        self.gcp_api_cidr = gcp_api_cidr


# ProvisionerHcsPub2 - this class is getting used to deploy the hcs-sys-public-2 Pulumi project to GCP
class ProvisionerPub2(provisioner.Provisioner):
    stack_flag = "--stack dev"

    def __init__(self, input: InProvisionerPub2, name="HCS-2-PUBLIC", repo_name="hcs-sys-public-2", project_name=provisioner.PROJECT_NAME, log_level=provisioner.DEFAULT_LOG_LEVEL) -> None:
        provisioner.Provisioner.__init__(
            self, name, repo_name, project_name, log_level)
        self.input = input

    # Deploy Pulumi project
    def deploy(self):
        logging.info(f"START {self.name} ...")

        pulumi_config_dict = {
            "OnpremPeerIp": (self.input.on_prem_peer_ip, False),
            "OnpremSubnetCidr": (self.input.on_prem_subnet_cidr, False),
            "OnpremSharedSecret": (self.input.on_prem_shared_secret, True),
            "GcpVmReqHandlerPort": (self.input.gcp_vm_req_handler_port, False),
            "GcpVpcSubnetCidr": (self.input.gcp_vpc_subnet_cidr, False),
            "GcpApiCidr": (self.input.gcp_api_cidr, False)
        }

        logging.info(f"Set pulumi config...")
        for k, v in pulumi_config_dict.items():
            e, is_secret = v
            self.set_pulumi_data_config(k, e, is_secret)
        logging.info(f"Pulumi config set")

        logging.info(f"Deploy pulumi project ...")
        self.sys_call(f"pulumi up {self.stack_flag} -y",
                      self.get_sub_folder_path(self.repo_name))
        logging.info(f"Pulumi project deployed")

        logging.info(f"FINISHED {self.name}")

    # Destroy Pulumi project
    def destroy(self):
        logging.info(f"START DESTROYING {self.name} ...")
        self.sys_call(f"pulumi destroy {self.stack_flag} -f -y",
                      self.get_sub_folder_path(self.repo_name))
        logging.info(f"FINISHED DESTROYING {self.name}")

    # Get one of the outputs created by deploying the stack (Pulumi outputs)
    def get_output_var(self, key) -> str:
        return self.sys_call(f"pulumi stack output {key}", path=self.get_sub_folder_path(self.repo_name), wait_for_resp=True)

    # setPulumiDataConfig - set Pulumi config
    def set_pulumi_data_config(self, pulumiDataKey, value, secret=False):
        extra_flags = self.stack_flag[:]
        if secret:
            extra_flags += " --secret"
        self.sys_call(
            f"pulumi config set {extra_flags} --path data.{pulumiDataKey} {value}", self.get_sub_folder_path(self.repo_name))
