GCP_PROJECT="hcs-sys-direct-connect"
GCP_ZONE="europe-west3"
GCP_REGION="${GCP_ZONE}-a"
GCP_VPC="private-vpc"
GCP_VPC_SUBNET="private-network"
GCP_VPC_SUBNET_CIDR="10.10.0.0/20"
GCP_API_CIDR="199.36.153.4/30"
GCP_TEST_INSTANCE="instance-test-gcp"

echo "Set up a custom network"
# CHECK
gcloud compute --project=$GCP_PROJECT networks create $GCP_VPC --subnet-mode=custom

# CHECK
gcloud compute --project=$GCP_PROJECT networks subnets create $GCP_VPC_SUBNET \
    --network=$GCP_VPC --region=$GCP_ZONE \
    --range=$GCP_VPC_SUBNET_CIDR --enable-private-ip-google-access


echo "Create routes for private Cloud API access through a tunnel"
# CHECK
gcloud --project=$GCP_PROJECT compute routes create apis \
    --network=$GCP_VPC \
    --destination-range=$GCP_API_CIDR \
    --next-hop-gateway=default-internet-gateway


echo "Create a Compute Engine instance in your Google Cloud project for testing"
# CHECK
gcloud compute --project=$GCP_PROJECT instances create $GCP_TEST_INSTANCE \
    --zone=$GCP_REGION --machine-type=f1-micro --subnet=$GCP_VPC_SUBNET \
    --no-address --can-ip-forward --no-service-account --no-scopes \
    --image-family=debian-9 --image-project=debian-cloud \
    --boot-disk-size=10GB --boot-disk-type=pd-standard \
    --boot-disk-device-name=$GCP_TEST_INSTANCE

-
# echo
# echo
# echo "ON-PREM"
# echo
# echo
# ONPREM_PROJECT="hcs-sys-direct-connect-prem"
# ONPREM_ZONE="europe-west3"
# ONPREM_REGION="${ONPREM_ZONE}-a"
# ONPREM_VPC="my-on-prem-network"
# ONPREM_SUBNET="my-on-prem-subnet"
# ONPREM_SUBNET_CIDR="192.168.0.0/20"
# ONPREM_INSTANCE_VPN_GATEWAY="instance-vpn-gateway-on-prem"


# echo "1. NETWORK"
# echo "1.1. Set up a custom network"
# #CHECK
# gcloud compute --project=$ONPREM_PROJECT networks create $ONPREM_VPC --subnet-mode=custom

# #CHECK
# gcloud compute --project=$ONPREM_PROJECT networks subnets create $ONPREM_SUBNET \
#     --network=$ONPREM_VPC --region=$ONPREM_ZONE --range=$ONPREM_SUBNET_CIDR


# echo "1.2. Set firewall rules for VPN traffic/gateway and private API access"
# echo "1.2.1. In Cloud Shell, allow inbound ipsec traffic:"
# # CHECK
# gcloud compute --project=$ONPREM_PROJECT firewall-rules create allow-ipsec-500 \
#     --direction=INGRESS --priority=1000 --network=$ONPREM_VPC --action=ALLOW --rules=udp:500 \
#     --source-ranges=0.0.0.0/0

# gcloud compute --project=$ONPREM_PROJECT firewall-rules create allow-ssh-vpn \
#     --direction=INGRESS --priority=1000 --network=$ONPREM_VPC --action=ALLOW --rules=tcp:22 \
#     --source-ranges=0.0.0.0/0

# echo "1.2.2. Allow internal traffic to the private IP address ranges for Google Cloud:"
# gcloud compute --project=$ONPREM_PROJECT firewall-rules create allow-icmp-$ONPREM_VPC \
#     --direction=INGRESS --priority=1000 --network=$ONPREM_VPC --action=ALLOW --rules=icmp \
#     --source-ranges=$ONPREM_SUBNET_CIDR

# gcloud compute --project=$ONPREM_PROJECT firewall-rules create allow-dns-$ONPREM_VPC \
#     --direction=INGRESS --priority=1000 --network=$ONPREM_VPC --action=ALLOW --rules=udp:53 \
#     --source-ranges=$ONPREM_SUBNET_CIDR

# gcloud compute --project=$ONPREM_PROJECT firewall-rules create allow-443-$ONPREM_VPC \
#     --direction=INGRESS --priority=1000 --network=$ONPREM_VPC --action=ALLOW --rules=tcp:443 \
#     --source-ranges=$ONPREM_SUBNET_CIDR


# echo "2. INSTANCES"
# echo "2.1. Create a VM instance for the VPN gateway"
# gcloud compute --project=$ONPREM_PROJECT instances create $ONPREM_INSTANCE_VPN_GATEWAY  \
#     --zone=$ONPREM_REGION --machine-type=n1-standard-1 \
#     --subnet=$ONPREM_SUBNET  --can-ip-forward --no-service-account \
#     --no-scopes --image-family=debian-9 --image-project debian-cloud \
#     --image-project=debian-cloud --boot-disk-size=10GB \
#     --boot-disk-type=pd-standard --boot-disk-device-name=$ONPREM_INSTANCE_VPN_GATEWAY

# echo "2.2. Add a next-hop route through the VPN gateway"
# gcloud compute --project=$ONPREM_PROJECT routes create route-to-gcp-apis \
#     --network=$ONPREM_VPC --priority=1000 \
#     --destination-range=$GCP_API_CIDR --next-hop-instance=$ONPREM_INSTANCE_VPN_GATEWAY \
#     --next-hop-instance-zone=$ONPREM_REGION

# echo "2.3. Create a VM for testing"
# ONPREM_INSTANCE_TEST=instance-test-on-prem

# gcloud compute --project=$ONPREM_PROJECT instances create $ONPREM_INSTANCE_TEST \
#     --zone=$ONPREM_REGION --machine-type=n1-standard-1 \
#     --subnet=$ONPREM_SUBNET --can-ip-forward --no-service-account --no-scopes  \
#     --image-family=debian-9 \
#     --image-project=debian-cloud --boot-disk-size=10GB \
#     --boot-disk-type=pd-standard --boot-disk-device-name=$ONPREM_INSTANCE_TEST

# echo "2.4. Obtain, and make a note of, the public and private IP addresses of the VPN gateway (instance-vpn-gateway-on-prem):"
# gcloud compute instances list --project $ONPREM_PROJECT