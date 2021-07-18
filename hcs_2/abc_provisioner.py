from abc import ABC, abstractmethod
import logging
import os
import subprocess
import pathlib


PROJECT_NAME = "HCS2"
DEFAULT_LOG_LEVEL = logging.INFO


# Abstract deployment class used to implement concrete deployments.
class Provisioner(ABC):
    def __init__(self, name, repo_name, project_name=PROJECT_NAME, log_level=DEFAULT_LOG_LEVEL) -> None:
        self.project_name = project_name
        logging.basicConfig(level=log_level)
        self.name = name
        self.repo_name = repo_name

    # This method is getting used to deploy the infrastructure by executing IaC-Code (this also runs updates)
    @abstractmethod
    def deploy(self):
        pass

    # This method is getting used to destroy the deployed infrastructure by by exeucting IaC-Code
    @abstractmethod
    def destroy(self):
        pass

    # This method is used to get an output variable created by the IaC-Tool
    #  @key: The key that specifies which output you want to receive
    @abstractmethod
    def get_output_var(self, key) -> str:
        pass

    # This method is used to run a system call (like 'ls')
    #  @cmd: The command you want to execute (like 'pwd')
    #  @path: The path you wanto to jump to, to execute the command, leave it blank if you dont want to change your current path
    #  @wait_for_resp: Set this to true if you need to receive an output; if this is true, no logs will appear during the call in the STDOUT console terminal.
    def sys_call(self, cmd, path="", wait_for_resp=False) -> str:
        if path is not "":
            os.chdir(path)
        result = subprocess.run(
            cmd.split(" "), stdout=subprocess.PIPE if wait_for_resp else None)
        if result.returncode is not 0:
            print()
            logging.debug(result.stdout)
            logging.error(result.stderr)
            raise SystemExit("Error occured, sysCall not successfull, exit")
        response = result.stdout.decode('utf-8') if wait_for_resp else ""
        return response

    # Returns the path of a subfolder
    #  @sub_path: This variable adds a path to the end of the current path (like: resp='/User/?/hcs/hcs_2/' + 'sub_path')
    def get_sub_folder_path(self, sub_path="") -> str:
        return f"{pathlib.Path(__file__).parent.resolve()}/{sub_path}"
        # return subfolder
