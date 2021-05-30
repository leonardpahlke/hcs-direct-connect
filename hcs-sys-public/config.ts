export const projectName = "hcs";
export const deployEnvironment = "dev";

export function GetTags(name: string) {
  return {
    Name: name,
    ProjectName: projectName,
    DeployEnvironment: deployEnvironment,
    CreatedBy: "Leonard Pahlke",
  };
}

export const clusterReqHandlerName = projectName + "-cluster-req-han";

// Config
export const albClusterReqHandlerPort = 80;

export const clusterReqHandlerDesiredAmount = 1;
export const clusterReqHandlerMemory = 128;
