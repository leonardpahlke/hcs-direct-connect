import { Post, Route } from "tsoa";

interface SignInResponse {
  message: string;
  statusCode: number;
}

@Route("sign-in")
export default class SignInController {
  @Post("/:username/:password")
  public async getMessage(
    username: string,
    password: string
  ): Promise<SignInResponse> {
    // request legacy component
    const searchResult = true;
    if (searchResult) {
      return {
        message: "user signed in",
        statusCode: 200,
      };
    } else {
      return {
        message: "user not found",
        statusCode: 404,
      };
    }
  }
}
