import { Post, Route } from "tsoa";

interface SignOutResponse {
  message: string;
  statusCode: number;
}

@Route("sign-out/:username/:password")
export default class SignUpController {
  @Post("/")
  public async getMessage(
    username: string,
    password: string
  ): Promise<SignOutResponse> {
    // check if user already exists
    const searchResult = true;
    if (searchResult) {
      return {
        message: "user already exists",
        statusCode: 404,
      };
    }

    // createUser(username, password);
    return {
      message: "user signed up",
      statusCode: 200,
    };
  }
}
