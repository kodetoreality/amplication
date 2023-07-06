import {
  CloneUrlArgs,
  CreateBranchArgs,
  CreatePullRequestCommentArgs,
  CreatePullRequestFromFilesArgs,
  EnumGitOrganizationType,
  GetBranchArgs,
  GetFileArgs,
  GitProviderCreatePullRequestArgs,
  GitProviderGetPullRequestArgs,
} from "../../types";
import { AwsCodeCommitService } from "./aws-code-commit.service";
import { MockedLogger } from "@amplication/util/logging/test-utils";
import {
  CodeCommitClient,
  CreateRepositoryCommand,
  GetFileCommand,
  GetRepositoryCommand,
  ListRepositoriesCommand,
} from "@aws-sdk/client-codecommit";
import { mockClient } from "aws-sdk-client-mock";

const awsClientMock = mockClient(CodeCommitClient);

describe("AwsCodeCommit", () => {
  let gitProvider: AwsCodeCommitService;

  beforeEach(() => {
    gitProvider = new AwsCodeCommitService(
      {
        gitCredentials: {
          username: "username",
          password: "password",
        },
        sdkCredentials: {
          accessKeyId: "accessKeyId",
          accessKeySecret: "accessKeySecret",
          region: "region",
        },
      },
      MockedLogger
    );

    awsClientMock.reset();
  });

  it("should throw an error when calling init()", async () => {
    await expect(gitProvider.init()).rejects.toThrowError(
      "Method not implemented."
    );
  });

  it("should throw an error when calling getGitInstallationUrl()", async () => {
    await expect(
      gitProvider.getGitInstallationUrl("workspaceId")
    ).rejects.toThrowError("Method not implemented.");
  });

  it("should throw an error when calling getCurrentOAuthUser()", async () => {
    await expect(
      gitProvider.getCurrentOAuthUser("accessToken")
    ).rejects.toThrowError("Method not implemented.");
  });

  it("should throw an error when calling getOAuthTokens()", async () => {
    await expect(
      gitProvider.getOAuthTokens("authorizationCode")
    ).rejects.toThrowError("Method not implemented.");
  });

  it("should throw an error when calling refreshAccessToken()", async () => {
    await expect(gitProvider.refreshAccessToken()).rejects.toThrowError(
      "Method not implemented."
    );
  });

  it("should throw an error when calling getGitGroups()", async () => {
    await expect(gitProvider.getGitGroups()).rejects.toThrowError(
      "Method not implemented."
    );
  });

  describe("getRepository", () => {
    let getRepositoryArgs;

    beforeEach(() => {
      getRepositoryArgs = {
        repositoryName: "example-repo",
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should return a RemoteGitRepository when repositoryMetadata is valid", async () => {
      const repositoryMetadata = {
        defaultBranch: "main",
        repositoryName: "example-repo",
        cloneUrlHttp: "https://github.com/example/example-repo.git",
      };

      awsClientMock
        .on(GetRepositoryCommand, {
          repositoryName: getRepositoryArgs.repositoryName,
        })
        .resolves({
          repositoryMetadata,
        });

      const expectedRepository = {
        admin: false,
        defaultBranch: "main",
        fullName: "example-repo",
        name: "example-repo",
        private: true,
        url: "https://github.com/example/example-repo.git",
        groupName: null,
      };

      const result = await gitProvider.getRepository(getRepositoryArgs);

      expect(result).toStrictEqual(expectedRepository);
    });

    it("should throw an error when repositoryMetadata is not valid", async () => {
      const repositoryMetadata = {};
      awsClientMock
        .on(GetRepositoryCommand, {
          repositoryName: getRepositoryArgs.repositoryName,
        })
        .resolves({
          repositoryMetadata,
        });

      await expect(
        gitProvider.getRepository(getRepositoryArgs)
      ).rejects.toThrow("Repository example-repo not found");
    });
  });

  describe("getRepositories", () => {
    let getRepositoriesArgs;

    beforeEach(() => {
      getRepositoriesArgs = {
        pagination: {
          page: 1,
          perPage: 10,
        },
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should return paginated repositories when repositories exist", async () => {
      const repositories = [
        { repositoryName: "repo1" },
        { repositoryName: "repo2" },
        { repositoryName: "repo3" },
      ];

      awsClientMock
        .on(ListRepositoriesCommand, {
          sortBy: "repositoryName",
          order: "ascending",
        })
        .resolves({ repositories });

      const expectedRepositories = [
        {
          admin: false,
          defaultBranch: "",
          fullName: "repo1",
          name: "repo1",
          private: true,
          url: "",
          groupName: null,
        },
        {
          admin: false,
          defaultBranch: "",
          fullName: "repo2",
          name: "repo2",
          private: true,
          url: "",
          groupName: null,
        },
        {
          admin: false,
          defaultBranch: "",
          fullName: "repo3",
          name: "repo3",
          private: true,
          url: "",
          groupName: null,
        },
      ];

      const result = await gitProvider.getRepositories(getRepositoriesArgs);

      expect(result.pagination).toEqual(getRepositoriesArgs.pagination);
      expect(result.repos).toStrictEqual(expectedRepositories);
      expect(result.total).toBe(repositories.length);
    });

    it("should return paginated repositories based on pagination settings", async () => {
      const repositories = [
        { repositoryName: "repo1", repositoryId: "repo1" },
        { repositoryName: "repo2", repositoryId: "repo2" },
        { repositoryName: "repo3", repositoryId: "repo3" },
        { repositoryName: "repo4", repositoryId: "repo4" },
        { repositoryName: "repo5", repositoryId: "repo5" },
      ];

      awsClientMock
        .on(ListRepositoriesCommand, {
          sortBy: "repositoryName",
          order: "ascending",
        })
        .resolves({ repositories });

      const paginationSettings = {
        page: 2,
        perPage: 2,
      };

      const expectedRepositories = [
        {
          admin: false,
          defaultBranch: "",
          fullName: "repo3",
          name: "repo3",
          private: true,
          url: "",
          groupName: null,
        },
        {
          admin: false,
          defaultBranch: "",
          fullName: "repo4",
          name: "repo4",
          private: true,
          url: "",
          groupName: null,
        },
      ];

      const result = await gitProvider.getRepositories({
        pagination: paginationSettings,
      });

      expect(result.pagination).toEqual(paginationSettings);
      expect(result.repos).toStrictEqual(expectedRepositories);
      expect(result.total).toBe(repositories.length);
    });

    it("should return no repositories when no repositories exist", async () => {
      awsClientMock
        .on(ListRepositoriesCommand, {
          sortBy: "repositoryName",
          order: "ascending",
        })
        .resolves({ repositories: [] });

      const repos = await gitProvider.getRepositories(getRepositoriesArgs);
      expect(repos).toStrictEqual({
        pagination: getRepositoriesArgs.pagination,
        repos: [],
        total: 0,
      });
    });
  });

  describe("createRepository", () => {
    let createRepositoryArgs;

    beforeEach(() => {
      createRepositoryArgs = {
        repositoryName: "example-repo",
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should return a RemoteGitRepository when repositoryMetadata is valid", async () => {
      const repositoryMetadata = {
        defaultBranch: "main",
        repositoryName: "example-repo",
        cloneUrlHttp: "https://github.com/example/example-repo.git",
      };
      awsClientMock
        .on(CreateRepositoryCommand, {
          repositoryName: "example-repo",
        })
        .resolves({
          repositoryMetadata,
        });

      const expectedRepository = {
        admin: false,
        defaultBranch: "main",
        fullName: "example-repo",
        name: "example-repo",
        private: true,
        url: "https://github.com/example/example-repo.git",
        groupName: null,
      };

      const result = await gitProvider.createRepository(createRepositoryArgs);

      expect(result).toStrictEqual(expectedRepository);
    });

    it("should throw an error when repositoryMetadata is not valid", async () => {
      const repositoryMetadata = {};
      awsClientMock
        .on(CreateRepositoryCommand, {
          repositoryName: "example-repo",
        })
        .resolves({
          repositoryMetadata,
        });

      await expect(
        gitProvider.createRepository(createRepositoryArgs)
      ).rejects.toThrow("Repository example-repo not found");
    });
  });

  it("should return always true when calling deleteGitOrganization() since there is nothing to uninstall/delete when an organisation is deleted in AWS CodeCommit.", async () => {
    const result = await gitProvider.deleteGitOrganization();
    expect(result).toBe(true);
  });

  describe("getOrganization", () => {
    it("should return an hardcoded aws codecommit organisation", async () => {
      const result = await gitProvider.getOrganization();

      expect(result).toEqual({
        name: "AWS CodeCommit",
        type: EnumGitOrganizationType.User,
        useGroupingForRepositories: false,
      });
    });
  });

  describe("getFile", () => {
    let getFileArgs;

    beforeEach(() => {
      getFileArgs = {
        path: "/path/to/file.txt",
        repositoryName: "example-repo",
        ref: "main",
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should return a GitFile when file content and file path exist", async () => {
      const expectedGitFile = {
        content: "file content",
        path: "/path/to/file.txt",
        name: "file",
      };

      awsClientMock
        .on(GetFileCommand, {
          repositoryName: getFileArgs.repositoryName,
          filePath: getFileArgs.path,
          commitSpecifier: getFileArgs.ref,
        })
        .resolves({
          fileContent: Buffer.from("file content"),
          filePath: "/path/to/file.txt",
        });

      const result = await gitProvider.getFile(getFileArgs);

      expect(result).toEqual(expectedGitFile);
    });

    it("should return null when file content or file path do not exist", async () => {
      awsClientMock
        .on(GetFileCommand, {
          commitSpecifier: getFileArgs.ref,
          filePath: getFileArgs.path,
          repositoryName: getFileArgs.repositoryName,
        })
        .resolves({});

      const result = await gitProvider.getFile(getFileArgs);

      expect(result).toBeNull();
    });

    it("should return null when an error occurs", async () => {
      awsClientMock
        .on(GetFileCommand, {
          commitSpecifier: getFileArgs.ref,
          filePath: getFileArgs.path,
          repositoryName: getFileArgs.repositoryName,
        })
        .rejects(new Error("error"));
      const result = await gitProvider.getFile(getFileArgs);

      expect(result).toBeNull();
    });
  });

  it("should throw an error when calling createPullRequestFromFiles()", async () => {
    const createPullRequestFromFilesArgs = <CreatePullRequestFromFilesArgs>{
      /* provide appropriate arguments */
    };
    await expect(
      gitProvider.createPullRequestFromFiles(createPullRequestFromFilesArgs)
    ).rejects.toThrowError("Method not implemented.");
  });

  it("should throw an error when calling getPullRequest()", async () => {
    const getPullRequestArgs = <GitProviderGetPullRequestArgs>{
      /* provide appropriate arguments */
    };
    await expect(
      gitProvider.getPullRequest(getPullRequestArgs)
    ).rejects.toThrowError("Method not implemented.");
  });

  it("should throw an error when calling createPullRequest()", async () => {
    const createPullRequestArgs = <GitProviderCreatePullRequestArgs>{
      /* provide appropriate arguments */
    };
    await expect(
      gitProvider.createPullRequest(createPullRequestArgs)
    ).rejects.toThrowError("Method not implemented.");
  });

  it("should throw an error when calling getBranch()", async () => {
    const args = <GetBranchArgs>{
      /* provide appropriate arguments */
    };
    await expect(gitProvider.getBranch(args)).rejects.toThrowError(
      "Method not implemented."
    );
  });

  it("should throw an error when calling createBranch()", async () => {
    const args = <CreateBranchArgs>{
      /* provide appropriate arguments */
    };
    await expect(gitProvider.createBranch(args)).rejects.toThrowError(
      "Method not implemented."
    );
  });

  it("should throw an error when calling getFirstCommitOnBranch()", async () => {
    const args = <GetBranchArgs>{
      /* provide appropriate arguments */
    };
    await expect(gitProvider.getFirstCommitOnBranch(args)).rejects.toThrowError(
      "Method not implemented."
    );
  });

  it("should throw an error when calling getCloneUrl()", async () => {
    const args = <CloneUrlArgs>{
      /* provide appropriate arguments */
    };
    await expect(gitProvider.getCloneUrl(args)).rejects.toThrowError(
      "Method not implemented."
    );
  });

  it("should throw an error when calling createPullRequestComment()", async () => {
    const args = <CreatePullRequestCommentArgs>{
      /* provide appropriate arguments */
    };
    await expect(
      gitProvider.createPullRequestComment(args)
    ).rejects.toThrowError("Method not implemented.");
  });

  it("should throw an error when calling getAmplicationBotIdentity()", async () => {
    await expect(gitProvider.getAmplicationBotIdentity()).rejects.toThrowError(
      "Method not implemented."
    );
  });
});