import { Octokit } from "@octokit/rest";
import { RequestError } from "@octokit/request-error";

// 从环境变量中获取 GitHub 配置
const GITHUB_TOKEN: string = process.env.GITHUB_TOKEN ?? '';
const GITHUB_OWNER: string = process.env.GITHUB_OWNER ?? '';
const GITHUB_REPO: string = process.env.GITHUB_REPO ?? '';
const GITHUB_REG: string = process.env.GITHUB_REG ?? '';

if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO || !GITHUB_REG) {
  throw new Error("GitHub environment variables are not set");
}

// 初始化 Octokit 客户端
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

// 定义更准确的文件内容接口
/* interface GitHubFileContent {
  type: "file";
  content: string;
  sha: string;
  size: number;
  name: string;
  path: string;
  url: string;
  git_url: string | null;
  html_url: string | null;
  download_url: string | null;
} */

// 自定义错误类
class GitHubFileError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = "GitHubFileError";
  }
}

/**
 * 读取 GitHub 仓库中的文件内容
 * @param repo 仓库名称 (GITHUB_REPO 或 GITHUB_REG)
 * @param path 文件路径
 * @returns 文件内容（字符串）
 * @throws GitHubFileError
 */
async function getFileContent(repo: string, path: string): Promise<string> {
  try {
    const response = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo,
      path,
    });

    // 类型检查确保我们得到的是单个文件
    const data = response.data;
    if (Array.isArray(data)) {
      throw new GitHubFileError("Path points to a directory, not a file");
    }
    
    if (data.type !== "file") {
      throw new GitHubFileError(`Path points to a ${data.type}, not a file`);
    }

    if (!data.content) {
      throw new GitHubFileError("File content is empty");
    }

    return Buffer.from(data.content, "base64").toString("utf-8");
  } catch (error) {
    if (error instanceof RequestError) {
      throw new GitHubFileError(`GitHub API error: ${error.message}`, error);
    } else if (error instanceof Error) {
      throw new GitHubFileError("Error reading file", error);
    }
    throw new GitHubFileError("Unknown error reading file");
  }
}

/**
 * 读取主要 GitHub 仓库中的文件内容
 * @param path 文件路径
 * @returns 文件内容（字符串）
 * @throws GitHubFileError
 */
export async function readFile(path: string): Promise<string> {
  return getFileContent(GITHUB_REPO, path);
}

/**
 * 读取注册 GitHub 仓库中的文件内容
 * @param path 文件路径
 * @returns 文件内容（字符串）
 * @throws GitHubFileError
 */
export async function AuthFile(path: string): Promise<string> {
  return getFileContent(GITHUB_REG, path);
}

/**
 * 更新 GitHub 仓库中的文件内容
 * @param repo 仓库名称 (GITHUB_REPO 或 GITHUB_REG)
 * @param path 文件路径
 * @param content 新的文件内容
 * @param message 提交信息
 * @returns void
 * @throws GitHubFileError
 */
async function updateGithubFile(
  repo: string,
  path: string,
  content: string,
  message: string = "Update file"
): Promise<void> {
  try {
    const response = await octokit.repos.getContent({
      owner: GITHUB_OWNER,
      repo,
      path,
    });

    const data = response.data;
    if (Array.isArray(data)) {
      throw new GitHubFileError("Path points to a directory, not a file");
    }
    
    if (data.type !== "file") {
      throw new GitHubFileError(`Path points to a ${data.type}, not a file`);
    }

    if (!data.sha) {
      throw new GitHubFileError("File SHA is missing");
    }

    await octokit.repos.createOrUpdateFileContents({
      owner: GITHUB_OWNER,
      repo,
      path,
      message,
      content: Buffer.from(content).toString("base64"),
      sha: data.sha,
    });

    console.log("File updated successfully");
  } catch (error) {
    if (error instanceof RequestError) {
      throw new GitHubFileError(`GitHub API error: ${error.message}`, error);
    } else if (error instanceof Error) {
      throw new GitHubFileError("Error updating file", error);
    }
    throw new GitHubFileError("Unknown error updating file");
  }
}

/**
 * 更新主要 GitHub 仓库中的文件内容
 * @param path 文件路径
 * @param content 新的文件内容
 * @param message 提交信息
 * @returns void
 * @throws GitHubFileError
 */
export async function updateFile(
  path: string,
  content: string,
  message: string = "Update file"
): Promise<void> {
  return updateGithubFile(GITHUB_REPO, path, content, message);
}

/**
 * 更新注册 GitHub 仓库中的文件内容
 * @param path 文件路径
 * @param content 新的文件内容
 * @param message 提交信息
 * @returns void
 * @throws GitHubFileError
 */
export async function addAuth(
  path: string,
  content: string,
  message: string = "add user"
): Promise<void> {
  return updateGithubFile(GITHUB_REG, path, content, message);
}