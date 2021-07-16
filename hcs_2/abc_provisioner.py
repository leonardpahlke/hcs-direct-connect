from abc import ABC, abstractmethod
import logging
import os
import subprocess
import pathlib


# This class container meta information that is getting injected to all deployment classes.
class ProvisionerMeta:
    # @project_name: general name of the project mainly used for logging
    # @log_level: define which types of logs should be logged (like: logging.DEBUG, logging.INFO, ...)
    def __init__(self, project_name="HCS2", log_level=logging.INFO) -> None:
        self.project_name = project_name
        logging.basicConfig(level=log_level)


# Abstract deployment class used to implement concrete deployments.
class Provisioner(ABC):
    # This method is getting used to deploy the infrastructure by executing IaC-Code (this also runs updates)
    @abstractmethod
    def deploy(self):
        pass

    # This method is getting used to destroy the deployed infrastructure by by exeucting IaC-Code
    @abstractmethod
    def destroy(self):
        pass

    # This method contains logic to connect to one of the created resources.
    # If no resource is available for the connection, leave the parameter empty.
    # If multiple resources are available to connect to, specify the entity using the id parameter
    # @id: Optional, specify resources that you want to connect to
    @abstractmethod
    def connect(self, id):
        pass

    @abstractmethod
    def getOutputVar(self, key) -> str:
        pass

    # sysCall - run a system call (like 'ls')
    def sysCall(self, cmd, path="", wait_for_response=False):
        if path is not "":
            os.chdir(path)
        result = subprocess.run(
            cmd.split(" "), stdout=subprocess.PIPE if wait_for_response else None)
        if result.returncode is not 0:
            print()
            logging.debug(result.stdout)
            logging.error(result.stderr)
            raise SystemExit("Error occured, sysCall not successfull, exit")
        response = result.stdout.decode('utf-8') if wait_for_response else ""
        return response

    # Returns the path of a subfolder
    def getSubFolderPath(self, subfolder="") -> str:
        return f"{pathlib.Path(__file__).parent.resolve()}/{subfolder}"
        # return subfolder
