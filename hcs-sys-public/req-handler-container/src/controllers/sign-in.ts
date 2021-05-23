import { Post, Route } from "tsoa";
import { DefaultSessionTokenResponse } from "../models/default-response";
import { encodeSession } from "../auth/session";
import { secretKey } from "../config";
import { LegacySignIn } from "../request-legacy-sys";

@Route("sign-in")
export default class SignInController {
  @Post("/:username/:password")
  public async getMessage(
    username: string,
    password: string
  ): Promise<DefaultSessionTokenResponse> {
    // request legacy component
    return LegacySignIn(username, password).then((res) => {
      if (res) {
        const session = encodeSession(secretKey, {
          username: username,
          dateCreated: Date.now(),
        });
        return {
          message: "user signed-in",
          session: session,
          statusCode: 200,
        };
      } else {
        return {
          message: "user could not get signed-in",
          session: { token: "", expires: 0, issued: 0 },
          statusCode: 404,
        };
      }
    });
  }
}
