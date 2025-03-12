import { Octokit } from "octokit";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { markdownDevelopers } from "./markdown-developers.js";

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GitHub Token (可通过环境变量设置)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Octokit 高级配置
const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  throttle: {
    onRateLimit: (retryAfter, options, octokit, retryCount) => {
      console.warn(`触发限流! 请求: ${options.method} ${options.url}`);
      console.warn(`${retryCount + 1} 重试，${retryAfter} 秒后...`);
      return retryCount < 3; // 只重试3次
    },
    onSecondaryRateLimit: (retryAfter, options, octokit) => {
      // 次要限流 (滥用检测)
      console.warn(`触发次要限流! 请求: ${options.method} ${options.url}`);
      return false; // 不自动重试次要限流
    },
  },
});

// 添加检查当前 API 限流状态的函数
async function checkRateLimitStatus() {
  try {
    const { data } = await octokit.rest.rateLimit.get();
    const { rate } = data;

    const remaining = rate.remaining;
    const limit = rate.limit;
    const resetTime = new Date(rate.reset * 1000);
    const now = new Date();
    const minutesUntilReset = Math.round((resetTime - now) / 60000);

    console.log(`API 限流状态: ${remaining}/${limit} 剩余请求`);
    console.log(
      `重置时间: ${resetTime.toLocaleString()} (约 ${minutesUntilReset} 分钟后)`
    );

    return { remaining, limit, resetTime, minutesUntilReset };
  } catch (error) {
    console.error("获取限流状态失败:", error);
    return null;
  }
}

// 添加 API 请求限速函数
async function rateLimitedRequest(requestFn, maxRetries = 3) {
  let retries = 0;
  let lastError = null;

  while (retries <= maxRetries) {
    try {
      // 指数退避延迟，根据重试次数增加等待时间
      if (retries > 0) {
        const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
        console.log(`等待 ${Math.round(delay / 1000)} 秒后重试...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      return await requestFn();
    } catch (error) {
      lastError = error;

      // 检查是否是速率限制错误
      if (error.status === 403 && error.message.includes("rate limit")) {
        const resetTime = error.response?.headers?.["x-ratelimit-reset"];
        if (resetTime) {
          // 获取重置时间并适当等待
          const waitTime = Number(resetTime) * 1000 - Date.now() + 1000;
          if (waitTime > 0 && waitTime < 3600000) {
            // 最多等待1小时
            console.log(
              `达到 API 速率限制，等待 ${Math.round(
                waitTime / 1000
              )} 秒后继续...`
            );
            await new Promise((resolve) => setTimeout(resolve, waitTime));
            retries--; // 不计入重试次数
            continue;
          }
        }
      }

      retries++;
      console.error(`请求失败 (${retries}/${maxRetries}):`, error.message);

      if (retries > maxRetries) {
        throw lastError;
      }
    }
  }
}

async function fetchTopChineseUsers() {
  try {
    // 检查初始 API 限流状态
    const initialStatus = await checkRateLimitStatus();
    if (initialStatus && initialStatus.remaining < 100) {
      console.warn(
        `警告: API 请求配额较低 (${initialStatus.remaining}/${initialStatus.limit})，可能会触发限流`
      );
      if (initialStatus.minutesUntilReset < 30) {
        console.log(
          `建议等待 ${initialStatus.minutesUntilReset} 分钟后再运行脚本`
        );
      }
    }

    console.log("开始获取中国用户数据...");

    // 使用 GitHub API 搜索中国区用户
    // 注意：这里使用 location 参数，但因为 GitHub API 限制，我们需要分页获取更多数据
    let allUsers = [];

    // 优化城市列表，减少请求次数
    const locations = [
      "china",
      "beijing",
      "shanghai",
      "guangzhou",
      "shenzhen",
      "hangzhou",
      "chengdu",
      // 减少其他城市请求，按需添加
    ];

    // 设置搜索参数和结果缓存
    const searchCache = new Map();

    for (const location of locations) {
      console.log(`搜索位置: ${location}`);

      // 检查是否还有足够的请求配额
      const status = await checkRateLimitStatus();
      if (status && status.remaining < 10) {
        console.log(`API 请求配额不足，等待直到重置...`);
        const waitTime = status.resetTime - new Date() + 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      // 使用限速请求获取用户数据
      const data = await rateLimitedRequest(async () => {
        const cacheKey = `location:${location}`;
        if (searchCache.has(cacheKey)) {
          console.log(`使用缓存数据: ${cacheKey}`);
          return searchCache.get(cacheKey);
        }

        const response = await octokit.rest.search.users({
          q: `location:${location} followers:>100 sort:followers`,
          per_page: 100,
        });

        // 缓存结果
        searchCache.set(cacheKey, response.data);
        return response.data;
      });

      // 添加到用户列表中
      allUsers = [...allUsers, ...data.items];

      // 适当延迟以减轻 API 负担
      console.log(`已搜索 ${location}，找到 ${data.items.length} 名用户`);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // 去重
    const uniqueUsers = [];
    const uniqueIds = new Set();

    for (const user of allUsers) {
      if (!uniqueIds.has(user.id)) {
        uniqueIds.add(user.id);
        uniqueUsers.push(user);
      }
    }

    console.log(`去重后共有 ${uniqueUsers.length} 名用户`);

    // 分批处理用户详情请求，避免过多并发请求
    const batchSize = 5; // 每批处理用户数
    const sortedUsers = [];

    // 检查是否有本地缓存文件
    let cachedUsers = {};
    const cacheFilePath = path.resolve(
      __dirname,
      "../public/data/github-users-cache.json"
    );
    try {
      const cacheData = await fs.readFile(cacheFilePath, "utf8");
      cachedUsers = JSON.parse(cacheData);
      console.log(`已加载 ${Object.keys(cachedUsers).length} 个用户的缓存数据`);
    } catch (error) {
      console.log(`未找到缓存文件或无法读取，将创建新缓存`);
      cachedUsers = {};
    }

    for (let i = 0; i < uniqueUsers.length; i += batchSize) {
      const batch = uniqueUsers.slice(i, i + batchSize);
      console.log(
        `处理用户详情批次 ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          uniqueUsers.length / batchSize
        )}`
      );

      const batchResults = await Promise.all(
        batch.map(async (user) => {
          try {
            // 检查缓存中是否已有该用户数据
            const cachedUser = cachedUsers[user.login];

            if (cachedUser) {
              console.log(`使用缓存数据: ${user.login}`);
              return cachedUser.data;
            }

            // 使用限速请求获取用户详情
            const userData = await rateLimitedRequest(async () => {
              const response = await octokit.rest.users.getByUsername({
                username: user.login,
              });
              return response.data;
            });

            const userDataFormatted = {
              login: userData.login,
              name: userData.name || userData.login,
              avatar_url: userData.avatar_url,
              html_url: userData.html_url,
              followers: userData.followers,
              public_repos: userData.public_repos,
              bio: userData.bio,
              location: userData.location,
              twitter_username: userData.twitter_username,
              blog: userData.blog,
              company: userData.company,
              type: markdownDevelopers.includes(userData.login)
                ? "markdown"
                : "code",
            };

            // 更新缓存
            cachedUsers[user.login] = {
              cachedAt: new Date().toISOString(),
              data: userDataFormatted,
            };

            return userDataFormatted;
          } catch (error) {
            console.error(`获取用户详情出错: ${user.login}`, error);
            return null;
          }
        })
      );

      // 添加有效结果到排序用户列表
      sortedUsers.push(...batchResults.filter((user) => user !== null));

      // 每处理完5个批次，保存一次缓存
      if (
        (Math.floor(i / batchSize) + 1) % 5 === 0 ||
        i + batchSize >= uniqueUsers.length
      ) {
        try {
          // 确保目录存在
          const dataDir = path.resolve(__dirname, "../public/data");
          await fs.mkdir(dataDir, { recursive: true });

          // 保存缓存文件
          await fs.writeFile(
            cacheFilePath,
            JSON.stringify(cachedUsers, null, 2)
          );
          console.log(
            `已更新缓存文件，包含 ${Object.keys(cachedUsers).length} 个用户数据`
          );
        } catch (error) {
          console.error(`保存缓存文件失败:`, error);
        }
      }

      // 批次间添加延迟
      if (i + batchSize < uniqueUsers.length) {
        console.log("批次处理完成，等待下一批...");
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    // 按照 followers 排序
    sortedUsers.sort((a, b) => b.followers - a.followers);

    // 添加最后更新时间
    const data = {
      updateTime: new Date().toISOString(),
      developers: sortedUsers,
    };

    // 创建数据目录（如果不存在）
    const dataDir = path.resolve(__dirname, "../public/data");
    await fs.mkdir(dataDir, { recursive: true });

    // 写入 JSON 文件
    await fs.writeFile(
      path.resolve(dataDir, "github-ranking.json"),
      JSON.stringify(data, null, 2)
    );

    console.log(`获取完成！共有 ${sortedUsers.length} 名开发者。`);

    // 最终检查 API 状态
    await checkRateLimitStatus();
  } catch (error) {
    console.error("获取用户数据失败:", error);
  }
}

fetchTopChineseUsers();
