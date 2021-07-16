import logging
import hcs_2.abc_provisioner as provisioner


class InProvisionerHcsPub2:
    # @onpremPeerIp:        Public IPv4 adress of the vpn tunnel hosted on the on premise gateway vm
    # @onpremSubnetCidr:    Network cidr range that is used for on prem services
    # @onpremSharedSecret:  VPN Tunnel shared secret (used by strongswarn)
    # @gcpVmReqHandlerPort: request handler container port, that is used to receive traffic
    # @gcpVpcSubnetCidr:    GCP VPC CIDR
    # @gcpApiCidr:          GCP API CIDR
    def __init__(self,
                 on_prem_peer_ip=None,
                 on_prem_subnet_cidr="10.194.0.0/20",
                 on_premSharedSecret=None,
                 gcp_vm_req_handler_port="8000",
                 gcp_vpc_subnet_cidr="10.10.0.0/20",
                 gcp_api_cidr="199.36.153.4/30"
                 ) -> None:
        if on_prem_peer_ip is None or on_premSharedSecret is None:
            raise SystemExit(
                "Not enough arguments supplied; on_prem_peer_ip and on_premSharedSecret has to be set, cannot use defaults, exit")
        self.on_prem_peer_ip = on_prem_peer_ip
        self.on_prem_subnet_cidr = on_prem_subnet_cidr
        self.on_premSharedSecret = on_premSharedSecret
        self.gcp_vm_req_handler_port = gcp_vm_req_handler_port
        self.gcp_vpc_subnet_cidr = gcp_vpc_subnet_cidr
        self.gcp_api_cidr = gcp_api_cidr


# ProvisionerHcsPub2 - this class is getting used to deploy the hcs-sys-public-2 Pulumi project to GCP
class ProvisionerHcsPub2(provisioner.Provisioner):
    stack_flag = "--stack dev"
    # @meta:                       deployer meta information
    # @name:                       deployment name
    # @InProvisionerHcsPub2: Input config template

    def __init__(self, meta: provisioner.ProvisionerMeta, input: InProvisionerHcsPub2, name="HCS-2-PUBLIC", repo_name="hcs-sys-public-2") -> None:
        self.meta = meta
        self.name = name
        self.repo_name = repo_name
        self.input = input

    # Deploy pulumi project
    def deploy(self):
        logging.info(f"START {self.name} ...")

        pulumi_config_dict = {
            "OnpremPeerIp": (self.input.on_prem_peer_ip, False),
            "OnpremSubnetCidr": (self.input.on_prem_subnet_cidr, False),
            "OnpremSharedSecret": (self.input.on_premSharedSecret, True),
            "GcpVmReqHandlerPort": (self.input.gcp_vm_req_handler_port, False),
            "GcpVpcSubnetCidr": (self.input.gcp_vpc_subnet_cidr, False),
            "GcpApiCidr": (self.input.gcp_api_cidr, False)
        }

        logging.info(f"Set pulumi config...")
        for k, v in pulumi_config_dict.items():
            e, is_secret = v
            self.setPulumiDataConfig(k, e, is_secret)
        logging.info(f"Pulumi config set")

        logging.info(f"Deploy pulumi project ...")
        self.sysCall(f"pulumi up {self.stack_flag} -y",
                     self.getSubFolderPath(self.repo_name))
        logging.info(f"Pulumi project deployed")

        logging.info(f"FINISHED {self.name}")

    # Destroy pulumi project
    def destroy(self):
        logging.info(f"START DESTROYING {self.name} ...")
        self.sysCall(f"pulumi destroy -f {self.stack_flag}",
                     self.getSubFolderPath(self.repo_name))
        logging.info(f"FINISHED DESTROYING {self.name}")

    # Connect to request handler vm
    def connect(self, id):
        logging.info(f"Connect to {self.name} REQUEST_HANDLER VM")
        zone = self.sysCall("pulumi stack output zone {self.stack_flag}",
                            self.getSubFolderPath(self.repo_name))
        instance_name = self.sysCall(
            "pulumi stack output instance_name {self.stack_flag}", self.getSubFolderPath(self.repo_name))
        project_name = self.sysCall(
            "pulumi stack output project_name {self.stack_flag}", self.getSubFolderPath(self.repo_name))

        logging.info(f"With info: {zone}, {instance_name}, {project_name}")
        self.sysCall(
            f"gcloud beta compute ssh --zone {zone} {instance_name} --tunnel-through-iap --project {project_name}", self.getSubFolderPath(self.repo_name))

    # Get one of the outputs created by deploying the stack
    def getOutputVar(self, key) -> str:
        return self.sysCall(f"pulumi stack output {key}")

    # setPulumiDataConfig - set pulumi config
    def setPulumiDataConfig(self, pulumiDataKey, value, secret=False):
        extra_flags = self.stack_flag[:]
        if secret:
            extra_flags += " --secret"
        self.sysCall(
            f"pulumi config set {extra_flags} --path 'data.{pulumiDataKey}' {value}", self.getSubFolderPath(self.repo_name))
