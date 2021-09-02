// This file contains information which is getting imported in sub-directories

export const projectName = "hcs";
export const deployEnvironment = "dev";
export const author = "l.pahlke@reply.de";

/**
 * GetTags is a method that can get used to set tag to services created with pulumi
 * @param name Service name
 * @returns This function returns a map which can get used to TAG services deployed in AWS
 */
export function GetTags(name: string) {
  return {
    Name: name,
    ProjectName: projectName,
    DeployEnvironment: deployEnvironment,
    CreatedBy: author,
  };
}
