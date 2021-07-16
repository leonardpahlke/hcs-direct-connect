import logging
import hcs_2.abc_provisioner as provisioner


class InProvisionerHcsPriv2:
    # @vpc_cidr: on prem vpc cidr range
    # @pvt_key:  SSH Key that is getting used to connect to legacy system
    def __init__(self, vpc_cidr="10.194.0.0/20", pvt_key="~/.ssh/id_rsa_hcs") -> None:
        self.vpc_cidr = vpc_cidr
        self.pvt_key = pvt_key


# DeployerHcsSysPublic2 - this class is getting used to deploy the hcs-sys-public-2 Pulumi project to GCP
class ProvisionerHcsPriv2(provisioner.Provisioner):
    # @meta:                  deployer meta information
    # @name:                  deployment name
    # @InProvisionerHcsPriv2: Input config template
    def __init__(self, meta: provisioner.ProvisionerMeta, input: InProvisionerHcsPriv2, name="HCS-2-PRIVATE", repo_name="hcs-sys-private-2") -> None:
        self.meta = meta
        self.name = name
        self.repo_name = repo_name
        self.input = input

    # Deploy terraform project
    def deploy(self):
        logging.info(f"START DEPLOYMENT {self.name} ...")
        tf_config_dict = {"vpc_cidr": self.input.vpc_cidr,
                          "pvt_key": self.input.pvt_key}

        logging.info(f"Set terraform config...")
        tf_vars = " ".join(
            [f"-var {k}={v}" for k, v in tf_config_dict.items()])
        logging.info(f"Terraform config set")

        logging.info(f"Deploy terraform project ...")
        self.sysCall(
            f"terraform apply -auto-approve {tf_vars}", self.getSubFolderPath(self.repo_name))
        logging.info(f"Terraform project deployed")

        logging.info(f"FINISHED DEPLOYMENT {self.name}")

    # Destroy terraform project
    def destroy(self):
        logging.info(f"START DESTROYING {self.name} ...")
        self.sysCall(f"terraform destroy -auto-approve",
                     self.getSubFolderPath(self.repo_name))
        logging.info(f"FINISHED DESTROYING {self.name}")

    # Connect to legacy vm
    def connect(self, id):
        logging.info(f"START CONNECT {self.name} LegacySystem VM")
        vmPublicIpv4 = self.sysCall(
            "terraform output -raw floating_ipv4", self.getSubFolderPath(self.repo_name))

        logging.info(
            f"Connect to {vmPublicIpv4} with key {self.input.pvt_key}")
        self.sysCall(
            f"ssh -o StrictHostKeyChecking=no -i {self.input.pvt_key} root@{vmPublicIpv4}", self.getSubFolderPath(self.repo_name))

    # Get one of the outputs created by deploying the stack
    def getOutputVar(self, key) -> str:
        return self.sysCall(f"terraform output -raw {key}", self.getSubFolderPath(self.repo_name))
