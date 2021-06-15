GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo
echo 
echo "${GREEN}START HCS-SYS-PLATFORM - DEPLOY.SH ...${NC}"
echo
requestHandlerHostname="hcs-cluster-req-han-alb-c1d317a-81317706.eu-central-1.elb.amazonaws.com"
requestHandlerPath="/health-check-connection"
requestHandlerPort=8000

if [ $# -eq 3 ] 
then
    echo "Arguments supplied update defaults"

    $requestHandlerHostname=$1
    $requestHandlerPath=$2
    $requestHandlerPort=$3

    echo "updatd variable requestHandlerHostname to: $requestHandlerHostname"
    echo "updatd variable requestHandlerPath to: $requestHandlerPath"
    echo "updatd variable requestHandlerPort to: $requestHandlerPort"
elif [ $# -eq 0 ] 
then
    echo "${YELLOW}No arguments supplied, use default arguemnts${NC}"
else
    echo "${RED}Not enough arguments supplied, use defaults${NC}"
fi

echo "Set pulumi configuration..."
pulumi config set --path 'data.requestHandlerHostname' $requestHandlerHostname
pulumi config set --path 'data.requestHandlerPath' $requestHandlerPath
pulumi config set --path 'data.requestHandlerPort' $requestHandlerPort
echo "Pulumi configuration set"
echo

echo "Deploy Pulumi project..."
pulumi up -y
echo "Pulumi project deployed"

echo
echo "${GREEN}FINISHED HCS-SYS-PLATFORM - DEPLOY.SH${NC}"
echo