import { Post, Route } from "tsoa";
import { changeConfig, currentRuntimeConfig } from "../config";
import { SysInfoResponse } from "../response";

@Route("/set-config")
export default class SetConfigController {
  @Post("/:legacyprivateip/:legacyport")
  public async setContainerConfig(
    legacyprivateip: string,
    legacyport: string
  ): Promise<SysInfoResponse> {
    changeConfig({
      legacySysPrivateIp: legacyprivateip,
      legacySysPort: legacyport,
    });
    return {
      message: "config set",
      config: currentRuntimeConfig,
    };
  }
}
