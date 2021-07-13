GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo
echo 
echo "${GREEN}START HCS-SYS-PUBLIC-2 - DEPLOY.SH ...${NC}"
echo

# TO USE THE SCRIPT ENTER THOSE VARIABLES
# EXAMPLE: deploy.sh 206.189.250.139 10.194.0.0/20 SHARED_SECRET 8000 10.10.0.0/20 199.36.153.4/30

#       onpremPeerIp        string $1
#	onpremSubnetCidr    string $2
#	onpremSharedSecret  string $3
#	gcpVmReqHandlerPort int    $4
#	gcpVpcSubnetCidr    string $5
#	gcpApiCidr          string $6

if [ $# -eq 6 ] 
then
    echo "Arguments supplied update variables"

    OnpremPeerIp=$1
    OnpremSubnetCidr=$2
    OnpremSharedSecret=$3
    
    echo "setted variable OnpremPeerIp to: $OnpremPeerIp"
    echo "setted variable OnpremSubnetCidr to: $OnpremSubnetCidr"
    echo "setted variable OnpremSharedSecret to: $OnpremSharedSecret"
    
    GcpVmReqHandlerPort=$4
    GcpVpcSubnetCidr=$5
    GcpApiCidr=$6
    
    echo "setted variable GcpVmReqHandlerPort to: $GcpVmReqHandlerPort"
    echo "setted variable GcpVpcSubnetCidr to: $GcpVpcSubnetCidr"
    echo "setted variable GcpApiCidr to: $GcpApiCidr"

    echo "Set pulumi configuration..."
    pulumi config set --path 'data.OnpremPeerIp' $OnpremPeerIp
    pulumi config set --path 'data.OnpremSubnetCidr' $OnpremSubnetCidr
    pulumi config set --path 'data.OnpremSharedSecret' $OnpremSharedSecret

    pulumi config set --path 'data.GcpVmReqHandlerPort' $GcpVmReqHandlerPort
    pulumi config set --path 'data.GcpVpcSubnetCidr' $GcpVpcSubnetCidr
    pulumi config set --path 'data.GcpApiCidr' $GcpApiCidr
    echo "Pulumi configuration set"
    echo

    echo "Deploy Pulumi project..."
    pulumi up -y
    echo "Pulumi project deployed"

    echo
    echo "${GREEN}FINISHED HCS-SYS-PUBLIC-2 - DEPLOY.SH${NC}"
    echo
else
    echo "${RED}HCS-SYS-PUBLIC-2 Not enough arguments supplied; cannot use defaults, exit${NC}"
    exit 1;
fi
