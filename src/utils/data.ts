// 加载 GitHub 用户排行数据
export interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
  followers: number;
  public_repos: number;
  bio?: string;
  location?: string;
  blog?: string;
  company?: string;
  twitter_username?: string;
  type: "code" | "markdown";
}

export interface RankingData {
  updateTime: string;
  codeDevelopers: GitHubUser[];
  markdownDevelopers: GitHubUser[];
}

// 获取排行榜数据
export async function getRankingData(): Promise<RankingData> {
  try {
    // 使用绝对URL路径或使用import.meta.env.BASE_URL构建完整URL
    const response = await fetch(
        `${import.meta.env.SITE}/data/github-ranking.json`
    );

    if (!response.ok) {
      throw new Error(`获取数据失败: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("获取排行数据出错:", error);

    // 返回空数据结构
    return {
      updateTime: new Date().toISOString(),
      codeDevelopers: [],
      markdownDevelopers: [],
    };
  }
}
