import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AuthenticationClient,
  ChangePasswordRequest,
  JSONApiResponse,
  ManagementClient,
  SignUpRequest,
  SignUpResponse,
  TextApiResponse,
} from "auth0";
import { Env } from "../../env";
import { generatePassword } from "../auth/auth-utils";

export type Auth0User = {
  data: {
    email: string;
  };
};

@Injectable()
export class Auth0Service {
  private readonly auth0: AuthenticationClient;
  private readonly auth0Management: ManagementClient;
  private readonly clientId: string;
  private readonly businessEmailDbConnectionName: string;
  private clientHost: string;

  constructor(configService: ConfigService) {
    this.clientHost = configService.get(Env.CLIENT_HOST);

    this.clientId = configService.get<string>(Env.AUTH_ISSUER_CLIENT_ID);
    const clientSecret = configService.get<string>(
      Env.AUTH_ISSUER_CLIENT_SECRET
    );
    this.businessEmailDbConnectionName = configService.get<string>(
      Env.AUTH_ISSUER_CLIENT_DB_CONNECTION
    );
    this.auth0 = new AuthenticationClient({
      domain: configService.get<string>(Env.AUTH_ISSUER_BASE_URL),
      clientId: this.clientId,
      clientSecret,
    });
    this.auth0Management = new ManagementClient({
      domain: configService.get<string>(Env.AUTH_ISSUER_MANAGEMENT_BASE_URL),
      clientId: this.clientId,
      clientSecret: clientSecret,
    });
  }

  async createAuth0User(email: string): Promise<Auth0User> {
    const data: SignUpRequest = {
      email,
      password: generatePassword(),
      connection: this.businessEmailDbConnectionName,
    };

    const user: JSONApiResponse<SignUpResponse> =
      await this.auth0.database.signUp(data);

    return user;
  }

  async resetAuth0UserPassword(email: string): Promise<TextApiResponse> {
    const data: ChangePasswordRequest = {
      email,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      client_id: this.clientId,
      connection: this.businessEmailDbConnectionName,
    };

    const changePasswordResponse = await this.auth0.database.changePassword(
      data
    );

    return changePasswordResponse;
  }

  async getAuth0UserByEmail(email: string): Promise<boolean> {
    const user = await this.auth0Management.usersByEmail.getByEmail({ email });
    if (!user.data.length) return false;

    return user.data[0].email === email;
  }
}
