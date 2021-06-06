# This file will deploy the HCS system to the configured system.
# The deployment is based on the deployment diagram shown in the README.md file.
# The folowing three systems are getting deployed.
#   * hcs-sys-public-cloud
#   * hcs-sys-private-cloud
#   * hcs-sys-platform
# Subprojects can get deployed individually.
# The configuration has to get updated inline.
# Access to AWS is configured outside of this project scope (credentials file).

folder_hcs_sys_public_cloud="hcs-sys-public"
folder_hcs_sys_private_cloud="hcs-sys-private"
folder_hcs_sys_platform="hcs-sys-platform"

# CONFIGURATION

project_name="hcs"

# DEPLOYMENT

# --------
# 1. create hcs-sys-private-cloud setup useing vagrant
echo "DEPLOY-MAIN: 1. create hcs-sys-private-cloud setup useing vagrant"
cd $folder_hcs_sys_private_cloud
vagrant up
cd ..
echo

# --------
# 2. create hcs-sys-public-cloud setup useing pulumi
echo "DEPLOY-MAIN: 2. create hcs-sys-public-cloud setup useing pulumi"
# ...
echo

# --------
# 3. create hcs-sys-platform-cloud setup useing pulumi
echo "DEPLOY-MAIN: 3. create hcs-sys-platform-cloud setup useing pulumi"
# ...
echo

# --------
# 4. install hcs-sys-public-cloud gateway
echo "DEPLOY-MAIN: 4. install hcs-sys-public-cloud gateway"
# ...
echo

# --------
# 5. create private keys
# 5.1. create private key hcs-sys-public-cloud
echo "DEPLOY-MAIN: 5.1. create private key hcs-sys-public-cloud"
# ...
echo

# 5.2. create private key hcs-sys-private-cloud
echo "DEPLOY-MAIN: 5.2. create private key hcs-sys-private-cloud"
# ...
echo

# --------
# 6. create public keys
# 6.1. create public key hcs-sys-public-cloud
echo "DEPLOY-MAIN: 6.1. create public key hcs-sys-public-cloud"
# ...
echo

# 6.2. create public key hcs-sys-private-cloud
echo "DEPLOY-MAIN: 6.2. create public key hcs-sys-private-cloud"
# ...
echo

# --------
# 7. create vpn-tunnel beween private- and public-cloud
echo "DEPLOY-MAIN: 7. create vpn-tunnel beween private- and public-cloud"
# ...
echo

# --------
# 8. check connection (use other file "check-connection.sh")
echo "DEPLOY-MAIN: 8. check connection"
# ...
echo
