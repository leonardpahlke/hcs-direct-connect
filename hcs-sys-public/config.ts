export const projectName = "hcs-direct-inner-public";
export const deployEnvironment = "dev";
export const createdBy = "Leonard Pahlke";

export function GetTags(name: string) {
  return {
    Name: name,
    ProjectName: projectName,
    DeployEnvironment: deployEnvironment,
    CreatedBy: createdBy,
  };
}

export const clusterReqHandlerName = projectName + "-cluster-request-handler";

// Config
export const albClusterReqHandlerPort = 80;

export const clusterReqHandlerDesiredAmount = 1;
export const clusterReqHandlerMemory = 128;
