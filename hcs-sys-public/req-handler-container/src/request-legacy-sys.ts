import got from "got/dist/source";
import { currentRuntimeConfig } from "./config";

type legacySystemRoute = "sign-in" | "sign-up";
interface legacySystemDefaultRequestInfo {
  route: legacySystemRoute;
  username: string;
  password: string;
}

/**
 * Use this method if you would like to sign-in to the legacy system
 * @param username username which is getting send to the lagacy system
 * @param password password which is getting send to the lagacy system
 * @returns true if request succeeded and false if not
 */
export function LegacySignIn(
  username: string,
  password: string
): Promise<boolean> {
  return performLegacySystemHttpPostRequest({
    route: "sign-in",
    username: username,
    password: password,
  }).then((res) => {
    console.log(res.messageBody);
    return res.ok;
  });
}

/**
 * Use this method if you would like to sign-up to the legacy system
 * @param username username which is getting send to the lagacy system
 * @param password password which is getting send to the lagacy system
 * @returns true if request succeeded and false if not
 */
export function LegacySignUp(
  username: string,
  password: string
): Promise<boolean> {
  return performLegacySystemHttpPostRequest({
    route: "sign-up",
    username: username,
    password: password,
  }).then((res) => {
    console.log(res.messageBody);
    return res.ok;
  });
}

function performLegacySystemHttpPostRequest(
  requestInfo: legacySystemDefaultRequestInfo
): Promise<resLegacySystemPostReq> {
  return got
    .post(
      "http://" +
        currentRuntimeConfig.legacyContainerPrivateIp +
        ":" +
        currentRuntimeConfig.legacyContainerPort +
        "/" +
        requestInfo.route +
        "/?username=" +
        requestInfo.username +
        "&password=" +
        requestInfo.password
    )
    .then((response) => {
      return {
        ok: true,
        messageBody: response.body,
      };
    })
    .catch((error) => {
      return {
        ok: false,
        messageBody: error.response.body,
      };
    });
}

interface resLegacySystemPostReq {
  ok: boolean;
  messageBody: string;
}
