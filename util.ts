export const projectName = "hcs";
export const deployEnvironment = "dev";
export const author = "Leonard Pahlke";

export function GetTags(name: string) {
  return {
    Name: name,
    ProjectName: projectName,
    DeployEnvironment: deployEnvironment,
    CreatedBy: author,
  };
}
