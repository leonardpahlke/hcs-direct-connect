GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo
echo 
echo "${GREEN}START HCS-SYS-PUBLIC - DEPLOY.SH ...${NC}"
echo
albClusterReqHandlerPort=80
clusterReqHandlerDesiredAmount=1
clusterReqHandlerMemory=128

if [ $# -eq 3 ] 
then
    echo "Arguments supplied update defaults"

    $albClusterReqHandlerPort=$1
    $clusterReqHandlerDesiredAmount=$2
    $clusterReqHandlerMemory=$3

    echo "updatd variable albClusterReqHandlerPort to: $albClusterReqHandlerPort"
    echo "updatd variable clusterReqHandlerDesiredAmount to: $clusterReqHandlerDesiredAmount"
    echo "updatd variable clusterReqHandlerMemory to: $clusterReqHandlerMemory"
elif [ $# -eq 0 ] 
then
    echo "${YELLOW}No arguments supplied, use default arguemnts${NC}"
else
    echo "${RED}Not enough arguments supplied, use defaults${NC}"
fi
# pulumi config set --path 'data.nums[2]' 3

echo "Set pulumi configuration..."
pulumi config set --path 'data.albClusterReqHandlerPort' $albClusterReqHandlerPort
pulumi config set --path 'data.clusterReqHandlerDesiredAmount' $clusterReqHandlerDesiredAmount
pulumi config set --path 'data.clusterReqHandlerMemory' $clusterReqHandlerMemory
echo "Pulumi configuration set"
echo

echo "Deploy Pulumi project..."
pulumi up -y
echo "Pulumi project deployed"

echo
echo "${GREEN}FINISHED HCS-SYS-PUBLIC - DEPLOY.SH${NC}"
echo