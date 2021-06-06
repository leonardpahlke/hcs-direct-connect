echo
echo 
echo "START HCS-SYS-PUBLIC - DEPLOY.SH ..."
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
    echo "No arguments supplied, use default arguemnts"
else
    echo "Not enough arguments supplied, use defaults"
fi
# pulumi config set --path 'data.nums[2]' 3

echo "Set pulumi configuration..."
pulumi config set --path 'data.albClusterReqHandlerPort' $albClusterReqHandlerPort
pulumi config set --path 'data.clusterReqHandlerDesiredAmount' $clusterReqHandlerDesiredAmount
pulumi config set --path 'data.clusterReqHandlerMemory' $clusterReqHandlerMemory
echo "Pulumi configuration set"
echo

echo "Deploy Pulumi project..."
pulumi up
echo "Pulumi project deployed"

echo
echo "FINISHED HCS-SYS-PUBLIC - DEPLOY.SH"
echo