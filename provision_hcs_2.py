import os
import pathlib
import secrets
import subprocess
from hcs_2.abc_provisioner import ProvisionerMeta
from hcs_2.provision_hcs_priv import InProvisionerHcsPriv2, ProvisionerHcsPriv2
from hcs_2.provision_hcs_pub import InProvisionerHcsPub2, ProvisionerHcsPub2

# VARIABLES
meta = ProvisionerMeta()
folder_hcs_sys_platform = "hcs-sys-platform"


# Print message to terminal in light blue (for highliting)
def print_blue(msg):
    print(f"\n\033[1;34m{msg}\033[0m")


# Umwrap string to print in yellow
def yelw_str(msg) -> str:
    return f"\033[1;33m{msg}\033[0m"


# - - - - - - - - - - - - - - - - - - - - -
# Deploy HCS-2 system
#  1. deploy hcs-2-private project
#  2. deploy hcs-2-public project
#  3. deploy hcs-platform project
def hcs2_provision_deploy():
    # * * * * * * * * * * *
    # CONFIG
    # vpn-tunnel
    vpn_tunnel_shared_secret = secrets.token_urlsafe(16)
    # on-prem
    onprem_vpc_cidr = "10.194.0.0/20"
    # gcp
    gcp_vpc_subnet_cidr = "10.10.0.0/20"
    gcp_api_cidr = "199.36.153.4/30"
    gcp_vm_req_handler_port = "8000"
    request_handler_path = "/health-check-connection"

    # * * * * * * * * * * *
    # DEPLOY HCS-2-PRIVATE
    print_blue("START WITH HCS-2-PRIVATE")
    provisioner_priv = ProvisionerHcsPriv2(
        meta=meta, input=InProvisionerHcsPriv2(vpc_cidr=onprem_vpc_cidr))
    provisioner_priv.deploy()
    on_prem_peer_ip = provisioner_priv.getOutputVar("floating_ipv4")
    print(f"on_prem_peer_ip: {on_prem_peer_ip}")

    # * * * * * * * * * * *
    # DEPLOY HCS-2-PUBLIC
    print_blue("START WITH HCS-2-PUBLIC")
    provisioner_pub = ProvisionerHcsPub2(
        meta=meta, input=InProvisionerHcsPub2(
            on_prem_peer_ip=on_prem_peer_ip,
            on_prem_subnet_cidr=onprem_vpc_cidr,
            on_premSharedSecret=vpn_tunnel_shared_secret,
            gcp_vm_req_handler_port=gcp_vm_req_handler_port,
            gcp_vpc_subnet_cidr=gcp_vpc_subnet_cidr,
            gcp_api_cidr=gcp_api_cidr
        ))
    provisioner_pub.deploy()
    #gcp_tunnel_ipv4 = provisioner_pub.getOutputVar("tunnel_ip")
    #gcp_req_handler_vm_ipv4 = provisioner_pub.getOutputVar("")
    #print(f"gcp_tunnel_ipv4: {gcp_tunnel_ipv4}")

    # * * * * * * * * * * *
    # DEPLOY HCS-PLATFORM
    # subprocess.call(f"cd {folder_hcs_sys_platform}/", shell=True)
    # subprocess.call(
    #     f"./deploy.sh {gcp_req_handler_vm_ipv4} {request_handler_path} {gcp_vm_req_handler_port}", shell=True)
    # subprocess.call("cd ..", shell=True)
    # aws_platform_ipv4 = None


# - - - - - - - - - - - - - - - - - - - - -
# Destroy HCS-2 System
def hcs2_provision_destroy():
    print_blue("START HCS-DESTROY")
    ProvisionerHcsPub2(meta=meta, input=InProvisionerHcsPub2(
        on_prem_peer_ip="",
        on_premSharedSecret="",)).destroy()
    ProvisionerHcsPriv2(
        meta=meta, input=InProvisionerHcsPriv2()).destroy()

    # os.chdir(
    #    f"{pathlib.Path(__file__).parent.resolve()}/{folder_hcs_sys_platform}")
    #subprocess.call("./destroy.sh", shell=True)
    # os.chdir(pathlib.Path(__file__).parent.resolve())


# - - - - - - - - - - - - - - - - - - - - -
# Connect to one of the created resources // does not work - use the script ~/hcs/connect-hcs-2.sh
def hcs2_provision_connect():
    print_blue("START HCS-CONNECT")
    method = input(
        f"Select to which resource you want to connect to [{yelw_str('a')}, {yelw_str('b')}] \n- [{yelw_str('a')}]: gcp-req-handler \n- [{yelw_str('b')}]: do-legacy-vm \n>> ")
    if method == "a":
        ProvisionerHcsPub2(meta=meta, input=InProvisionerHcsPub2(
            on_prem_peer_ip="",
            on_premSharedSecret="",)).connect("")
    elif method == "b":
        ProvisionerHcsPriv2(
            meta=meta, input=InProvisionerHcsPriv2()).connect("")
    else:
        raise SystemExit(f"Invalid input received:[{method}], exit")


# Execute this file and select deploy / destroy - connect via the script ~/hcs/connect-hcs-2.sh to created resources
if __name__ == "__main__":
    print_blue("RUN HCS-2-PROVISION")
    method = input(
        f"Select method [{yelw_str('a')}, {yelw_str('b')}] \n- [{yelw_str('a')}]: deploy the system \n- [{yelw_str('b')}]: destroy the system \n>> ")

    if method == "a":
        hcs2_provision_deploy()
    elif method == "b":
        hcs2_provision_destroy()
    else:
        raise SystemExit(f"Invalid method selected:[{method}], exit")

    print_blue("DONE HCS-2-PROVISION")
