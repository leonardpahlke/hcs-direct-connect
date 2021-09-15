import logging
import hcs_2.abc_provisioner as provisioner


class InProvisionerPriv2:
    # @vpc_cidr: on prem vpc cidr range
    # @pvt_key:  SSH Key that is getting used to connect to legacy system
    def __init__(self, vpc_cidr="10.194.0.0/20", pvt_key="~/.ssh/id_rsa_hcs") -> None:
        self.vpc_cidr = vpc_cidr
        self.pvt_key = pvt_key


# DeployerHcsSysPublic2 - this class is getting used to deploy the hcs-sys-public-2 Pulumi project to GCP
class ProvisionerPriv2(provisioner.Provisioner):
    def __init__(self, input: InProvisionerPriv2, name="HCS-2-PRIVATE", repo_name="hcs-sys-private-2", project_name=provisioner.PROJECT_NAME, log_level=provisioner.DEFAULT_LOG_LEVEL) -> None:
        provisioner.Provisioner.__init__(
            self, name, repo_name, project_name, log_level)
        self.input = input

    # Deploy Terraform project
    def deploy(self):
        logging.info(f"START DEPLOYMENT {self.name} ...")
        tf_config_dict = {"vpc_cidr": self.input.vpc_cidr,
                          "pvt_key": self.input.pvt_key}

        logging.info(f"Set terraform config...")
        tf_vars = " ".join(
            [f"-var {k}={v}" for k, v in tf_config_dict.items()])
        logging.info(f"Terraform config set")

        logging.info(f"Deploy terraform project ...")
        self.sys_call(
            f"terraform apply -auto-approve {tf_vars}", self.get_sub_folder_path(self.repo_name))
        logging.info(f"Terraform project deployed")

        logging.info(f"FINISHED DEPLOYMENT {self.name}")

    # Destroy Terraform project
    def destroy(self):
        logging.info(f"START DESTROYING {self.name} ...")
        self.sys_call(f"terraform destroy -auto-approve",
                      self.get_sub_folder_path(self.repo_name))
        logging.info(f"FINISHED DESTROYING {self.name}")

    # Get one of the outputs created by deploying the stack (terraform outputs)
    def get_output_var(self, key) -> str:
        return self.sys_call(f"terraform output -raw {key}", path=self.get_sub_folder_path(self.repo_name), wait_for_resp=True)
