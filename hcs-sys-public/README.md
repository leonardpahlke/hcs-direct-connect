# HCS-SYS-PUBLIC

The public-cloud is configured in this directory and is getting deployed to aws.
The diagram below highlights the area that is being developed.

![Software Architecture](./assets/BA-05-Verteilungssicht-2-hcs-sys-public-cloud.png)

Run the script `deploy.sh` to deploy the pulumi project to AWS.
The script can get invoked with additional arguments to change the configuration.
For example `sh deploy.sh <...>`

- $1: albClusterReqHandlerPort: number;
- $2: clusterReqHandlerDesiredAmount: number;
- $3: clusterReqHandlerMemory: number;

You need to manually add the file `config.ts` which contains enviironment specific information.
See an example below

```typescript
export const XXX_GATEWAY_PUBLIC_KEY =
  "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQD3F6tyPEFEzV0LX3X8BsXdMsQz1x2cEikKDEY0aIj41qgxMCP/iteneqXSIFZBp5vizPvaoIR3Um9xK7PGoW8giupGn+EPuxIA4cDM4vzOqOkiMPhz5XK0whEjkVzTo4+S0puvDZuwIsdiW9mxhJc7tgBNL0cYlWSYVkz4G/fslNfRPW5mYAM49f4fhtxPb5ok4Q2Lg9dPKVHO/Bgeu5woMc7RY0p1ej6D4CKFE6lymSDJpW0YHX/wqE9+cfEauh7xZcG0q9t2ta6F6fmX0agvpFyZo8aFbXeUBr7osSCJNgvavWbM/06niWrOvYX2xwWdhXmXSrbX8ZbabVohBK41 email@example.com";
```
