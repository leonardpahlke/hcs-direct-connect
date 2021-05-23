import { runtimeConfig } from "../config";

export interface SysInfoResponse {
  message: string;
  config: runtimeConfig;
}
