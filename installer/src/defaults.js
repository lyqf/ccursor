/**
 * Cursor++ 共享默认值
 *
 * 这些常量是 installer 与 extension server 共同的兜底数据：
 *   - install 时若 ~/.ccursor/{routes,providers}.json 不存在，installer 用这里的值释放
 *   - patcher 注入到 Cursor 进程的代码读 routes.json 失败时也用这里的兜底
 *   - extension server 启动时若 routes.json 缺字段，按这里的默认补齐
 *
 * Cursor++/src/server/data/defaults.ts 必须与本文件保持一致。
 */

export const CCURSOR_DIR_NAME = '.ccursor';
export const ROUTES_FILE_NAME = 'routes.json';
export const PROVIDERS_FILE_NAME = 'providers.json';
export const DB_FILE_NAME = 'cursor.db';

export const DEFAULT_HOST = '127.0.0.1';
export const DEFAULT_PORT = 39831;
export const DEFAULT_COLLECTOR_PORT = 14800;

/**
 * BASE_REDIRECT —— 不论 BYOK 开关如何,**永远**生效的劫持白名单。
 *
 * 当前只包含"假装订阅"的 2 个 Stripe profile stub。
 * 这些是无 Cursor 付费账号的用户切到 OFF 模式后,仍然需要 stub 的最小集
 * (让 Cursor 渲染器认为账户是 ultra,不进入付费引导)。
 */
export const BASE_REDIRECT = [
  'REST:/auth/full_stripe_profile',
  'REST:/auth/stripe_profile',
];

/**
 * BYOK_REDIRECT —— 仅在 byokMode === 'on' 时追加进生效白名单。
 *
 * 关闭 BYOK 时这些项**必须**移除,让对应请求直通官方:
 *   - 模型列表 / Agent 流 / Bidi 队列: 关 BYOK 后客户端走真 Cursor
 *   - ChatService 摘要: BYOK Agent 流的本地 sqlite 持久化
 *   - 一组整服务 stub: 支撑 BYOK 流程下的账号 / dashboard / serverConfig 假数据
 *     (整服务挂入是为了后续逐方法实装,当前未实装的方法返回 unimplemented)
 *
 * 注意 BidiAppend 位于 aiserver.v1 包下, 不是 agent.v1 —— 切记别又写错。
 */
export const BYOK_REDIRECT = [
  // ── BYOK 核心 ──
  'aiserver.v1.AiService/AvailableModels',
  'agent.v1.AgentService/RunSSE',
  'agent.v1.AgentService/UploadConversationBlobs',
  'aiserver.v1.BidiService/BidiAppend',

  // ── 本地摘要持久化(BYOK Agent 配套) ──
  'aiserver.v1.ChatService/GetConversationSummary',
  'aiserver.v1.ChatService/StreamSpeculativeSummaries',

  // ── Rules / Knowledge Base (本地持久化) ──
  'aiserver.v1.AiService/KnowledgeBaseList',
  'aiserver.v1.AiService/KnowledgeBaseAdd',
  'aiserver.v1.AiService/KnowledgeBaseUpdate',
  'aiserver.v1.AiService/KnowledgeBaseRemove',
  // AiService: 模型/配置端点 — BYOK 拦截返回本地配置,不打官方
  'aiserver.v1.AiService/ServerTime',
  'aiserver.v1.AiService/GetDefaultModel',
  'aiserver.v1.AiService/GetDefaultModelNudgeData',

  // ── BYOK 流程下需要 stub 的服务 ──
  'aiserver.v1.AuthService',
  // AnalyticsService: 遥测上报返空; BootstrapStatsig 不拦截(直通官方拿真实 feature gate 配置)
  'aiserver.v1.AnalyticsService/Batch',
  // DashboardService: 逐方法挂入 — 未列出的方法 (如 ListMarketplacePlugins) 直接透传官方 API
  'aiserver.v1.DashboardService/GetPlanInfo',
  'aiserver.v1.DashboardService/GetCurrentPeriodUsage',
  'aiserver.v1.DashboardService/GetTeams',
  'aiserver.v1.DashboardService/GetUserPrivacyMode',
  'aiserver.v1.DashboardService/GetUsageLimitStatusAndActiveGrants',
  'aiserver.v1.DashboardService/GetEffectiveUserPlugins',
  'aiserver.v1.DashboardService/IsOnNewPricing',
  'aiserver.v1.DashboardService/GetManagedSkills',
  'aiserver.v1.DashboardService/GetTeamAdminSettingsOrEmptyIfNotInTeam',
  'aiserver.v1.DashboardService/GetTeamReposOrEmptyIfNotInTeam',
  // 3.6 新增: 不带 OrEmpty 后缀的 Team 端点 (非 team 用户打官方返回 unauthenticated 重试风暴)
  'aiserver.v1.DashboardService/GetTeamAdminSettings',
  'aiserver.v1.DashboardService/GetTeamBackgroundAgentSettings',
  'aiserver.v1.DashboardService/GetTeamRepos',
  // 'aiserver.v1.DashboardService/GetMe',
  'aiserver.v1.DashboardService/GetGlobalCommands',
  'aiserver.v1.DashboardService/GetTeamCommands',
  'aiserver.v1.DashboardService/GetSlackInstallUrl',
  'aiserver.v1.DashboardService/ShareCanvas',
  'aiserver.v1.DashboardService/LookupSharedCanvasByKey',
  'aiserver.v1.ServerConfigService',
  'aiserver.v1.NetworkService',
  'aiserver.v1.HealthService',
  'aiserver.v1.InAppAdService',

  // ── BackgroundComposerService (逐方法 stub — 启动轮询 + UI 初始化) ──
  'aiserver.v1.BackgroundComposerService/ListBackgroundComposers',
  'aiserver.v1.BackgroundComposerService/GetBackgroundComposerUserSettings',
  'aiserver.v1.BackgroundComposerService/ListTeamEnvironments',
  'aiserver.v1.BackgroundComposerService/ListPersonalEnvironments',

  // ── REST endpoints (BYOK 流程下需要的假账号 stub) ──
  'REST:/auth/has_valid_payment_method',
  'REST:/auth/poll',
  'REST:/auth/logout',
];

/** 兼容旧调用: 完整白名单 = BASE + BYOK */
export const DEFAULT_REDIRECT = [...BASE_REDIRECT, ...BYOK_REDIRECT];

// BYOK 开关: 1 = on (BYOK 启用), 0 = off (走官方)
export const DEFAULT_ROUTES = {
  $schemaVersion: 1,
  byokMode: 1,
  server: { host: DEFAULT_HOST, port: DEFAULT_PORT },
  collector: { host: DEFAULT_HOST, port: DEFAULT_COLLECTOR_PORT },
  redirect: [...BASE_REDIRECT, ...BYOK_REDIRECT],
};

/**
 * BYOK Provider 兜底常量 — server 读不到文件 / 文件损坏时的 fallback。
 * 不放任何 provider,避免"假装有配置"造成的歧义。
 * 用户通过 Cursor++ 设置面板或直接编辑 ~/.ccursor/providers.json 添加。
 */
export const DEFAULT_PROVIDERS = {
  "$schemaVersion": 1,
  "providers": [
    {
      "id": "mioffice-anthropic",
      "name": "Mioffice · Anthropic API",
      "type": "anthropic",
      "baseUrl": "https://api.llm.mioffice.cn/anthropic",
      "auth": {
        "kind": "token",
        "value": ""
      },
      "models": [
        {
          "id": "deepseek/deepseek-flash",
          "apiModel": "deepseek/deepseek-flash",
          "displayName": "[DeepSeek] DeepSeek Flash",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 128000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "amber_ai/claude-opus-4-6",
          "apiModel": "amber_ai/claude-opus-4-6",
          "displayName": "[Amber] Claude Opus 4.6",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "amber_ai/claude-opus-4-7",
          "apiModel": "amber_ai/claude-opus-4-7",
          "displayName": "[Amber] Claude Opus 4.7",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "amber_ai/claude-opus-4-8",
          "apiModel": "amber_ai/claude-opus-4-8",
          "displayName": "[Amber] Claude Opus 4.8",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "amber_ai/claude-sonnet-4-6",
          "apiModel": "amber_ai/claude-sonnet-4-6",
          "displayName": "[Amber] Claude Sonnet 4.6",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "amber_ai/claude-sonnet-5",
          "apiModel": "amber_ai/claude-sonnet-5",
          "displayName": "[Amber] Claude Sonnet 5",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "amber_ai/gpt-5.6-sol",
          "apiModel": "amber_ai/gpt-5.6-sol",
          "displayName": "[Amber] GPT-5.6 Sol",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1050000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "amber_ai/gpt-5.6-terra",
          "apiModel": "amber_ai/gpt-5.6-terra",
          "displayName": "[Amber] GPT-5.6 Terra",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1050000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-4.1",
          "apiModel": "azure_openai/gpt-4.1",
          "displayName": "[Azure] GPT-4.1",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1047576,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-4.1-mini",
          "apiModel": "azure_openai/gpt-4.1-mini",
          "displayName": "[Azure] GPT-4.1 mini",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1047576,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-4.1-nano",
          "apiModel": "azure_openai/gpt-4.1-nano",
          "displayName": "[Azure] GPT-4.1 nano",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1047576,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-4o",
          "apiModel": "azure_openai/gpt-4o",
          "displayName": "[Azure] GPT-4o",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 128000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-4o-mini",
          "apiModel": "azure_openai/gpt-4o-mini",
          "displayName": "[Azure] GPT-4o mini",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 128000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5",
          "apiModel": "azure_openai/gpt-5",
          "displayName": "[Azure] GPT-5",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.1",
          "apiModel": "azure_openai/gpt-5.1",
          "displayName": "[Azure] GPT-5.1",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.1-chat",
          "apiModel": "azure_openai/gpt-5.1-chat",
          "displayName": "[Azure] GPT-5.1 Chat",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 128000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.2",
          "apiModel": "azure_openai/gpt-5.2",
          "displayName": "[Azure] GPT-5.2",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.2-chat",
          "apiModel": "azure_openai/gpt-5.2-chat",
          "displayName": "[Azure] GPT-5.2 Chat",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 128000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.4",
          "apiModel": "azure_openai/gpt-5.4",
          "displayName": "[Azure] GPT-5.4",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1050000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.6-luna",
          "apiModel": "azure_openai/gpt-5.6-luna",
          "displayName": "[Azure] GPT-5.6 Luna",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1050000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.6-sol",
          "apiModel": "azure_openai/gpt-5.6-sol",
          "displayName": "[Azure] GPT-5.6 Sol",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1050000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.6-terra",
          "apiModel": "azure_openai/gpt-5.6-terra",
          "displayName": "[Azure] GPT-5.6 Terra",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1050000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-oss-120b",
          "apiModel": "azure_openai/gpt-oss-120b",
          "displayName": "[Azure] GPT OSS 120B",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 131072,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "deepseek/deepseek-v4-flash",
          "apiModel": "deepseek/deepseek-v4-flash",
          "displayName": "[DeepSeek] DeepSeek V4 Flash",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "deepseek/deepseek-v4-flash-vision-exp",
          "apiModel": "deepseek/deepseek-v4-flash-vision-exp",
          "displayName": "[DeepSeek] DeepSeek V4 Flash Vision Exp",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "deepseek/deepseek-v4-pro",
          "apiModel": "deepseek/deepseek-v4-pro",
          "displayName": "[DeepSeek] DeepSeek V4 Pro",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "hippo/gpt-5.6-sol",
          "apiModel": "hippo/gpt-5.6-sol",
          "displayName": "[Hippo] GPT-5.6 Sol",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1050000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "hippo/gpt-5.6-terra",
          "apiModel": "hippo/gpt-5.6-terra",
          "displayName": "[Hippo] GPT-5.6 Terra",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1050000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "oceanbase/deepseek-v4-flash-0731",
          "apiModel": "oceanbase/deepseek-v4-flash-0731",
          "displayName": "[OceanBase] DeepSeek V4 Flash 0731",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "oceanbase/deepseek-v4-pro-0813",
          "apiModel": "oceanbase/deepseek-v4-pro-0813",
          "displayName": "[OceanBase] DeepSeek V4 Pro 0813",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "ppio/pa/claude-haiku-4-5",
          "apiModel": "ppio/pa/claude-haiku-4-5",
          "displayName": "[PPIO] Claude Haiku 4.5",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 200000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "ppio/pa/claude-haiku-4-5-20251001",
          "apiModel": "ppio/pa/claude-haiku-4-5-20251001",
          "displayName": "[PPIO] Claude Haiku 4.5",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 200000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "ppio/pa/claude-opus-4-5-20251101",
          "apiModel": "ppio/pa/claude-opus-4-5-20251101",
          "displayName": "[PPIO] Claude Opus 4.5",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 200000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "ppio/pa/claude-opus-4-6",
          "apiModel": "ppio/pa/claude-opus-4-6",
          "displayName": "[PPIO] Claude Opus 4.6",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "ppio/pa/claude-opus-4-7",
          "apiModel": "ppio/pa/claude-opus-4-7",
          "displayName": "[PPIO] Claude Opus 4.7",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "ppio/pa/claude-opus-4-8",
          "apiModel": "ppio/pa/claude-opus-4-8",
          "displayName": "[PPIO] Claude Opus 4.8",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "ppio/pa/claude-sonnet-4-5-20250929",
          "apiModel": "ppio/pa/claude-sonnet-4-5-20250929",
          "displayName": "[PPIO] Claude Sonnet 4.5",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 200000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "ppio/pa/claude-sonnet-4-6",
          "apiModel": "ppio/pa/claude-sonnet-4-6",
          "displayName": "[PPIO] Claude Sonnet 4.6",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "ppio/pa/claude-sonnet-5",
          "apiModel": "ppio/pa/claude-sonnet-5",
          "displayName": "[PPIO] Claude Sonnet 5",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "ppio/gpt-4.1",
          "apiModel": "ppio/gpt-4.1",
          "displayName": "[PPIO] GPT-4.1",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1047576,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "ppio/gpt-4.1-mini",
          "apiModel": "ppio/gpt-4.1-mini",
          "displayName": "[PPIO] GPT-4.1 mini",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1047576,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "ppio/gpt-4o",
          "apiModel": "ppio/gpt-4o",
          "displayName": "[PPIO] GPT-4o",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 128000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "ppio/gpt-4o-mini",
          "apiModel": "ppio/gpt-4o-mini",
          "displayName": "[PPIO] GPT-4o mini",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 128000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "ppio/gpt-5",
          "apiModel": "ppio/gpt-5",
          "displayName": "[PPIO] GPT-5",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "ppio/gpt-5-mini",
          "apiModel": "ppio/gpt-5-mini",
          "displayName": "[PPIO] GPT-5 Mini",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "ppio/gpt-5-nano",
          "apiModel": "ppio/gpt-5-nano",
          "displayName": "[PPIO] GPT-5 Nano",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "ppio/pa/gpt-5",
          "apiModel": "ppio/pa/gpt-5",
          "displayName": "[PPIO] GPT-5",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "ppio/pa/gpt-5.5",
          "apiModel": "ppio/pa/gpt-5.5",
          "displayName": "[PPIO] GPT-5.5",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1050000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "ppio/pa/gpt-5.6-luna",
          "apiModel": "ppio/pa/gpt-5.6-luna",
          "displayName": "[PPIO] GPT-5.6 Luna",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1050000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "ppio/pa/gpt-5.6-sol",
          "apiModel": "ppio/pa/gpt-5.6-sol",
          "displayName": "[PPIO] GPT-5.6 Sol",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1050000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "ppio/pa/gpt-5.6-terra",
          "apiModel": "ppio/pa/gpt-5.6-terra",
          "displayName": "[PPIO] GPT-5.6 Terra",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1050000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "siliconflow/deepseek-ai/DeepSeek-V4-Flash",
          "apiModel": "siliconflow/deepseek-ai/DeepSeek-V4-Flash",
          "displayName": "[SiliconFlow] DeepSeek V4 Flash",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "siliconflow/Pro/deepseek-ai/DeepSeek-R1",
          "apiModel": "siliconflow/Pro/deepseek-ai/DeepSeek-R1",
          "displayName": "[SiliconFlow] DeepSeek-R1",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 164000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "streamlake/deepseek-v4-flash-0731",
          "apiModel": "streamlake/deepseek-v4-flash-0731",
          "displayName": "[StreamLake] DeepSeek V4 Flash 0731",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "streamlake/deepseek-v4-pro-0813",
          "apiModel": "streamlake/deepseek-v4-pro-0813",
          "displayName": "[StreamLake] DeepSeek V4 Pro 0813",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "tongyi/deepseek-r1",
          "apiModel": "tongyi/deepseek-r1",
          "displayName": "[Tongyi] DeepSeek-R1",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": false,
          "supportsImages": false,
          "contextTokenLimit": 128000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "tongyi/deepseek-v4-flash",
          "apiModel": "tongyi/deepseek-v4-flash",
          "displayName": "[Tongyi] DeepSeek V4 Flash",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "tongyi/deepseek-v4-flash-0731",
          "apiModel": "tongyi/deepseek-v4-flash-0731",
          "displayName": "[Tongyi] DeepSeek V4 Flash 0731",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "tongyi/deepseek-v4-pro",
          "apiModel": "tongyi/deepseek-v4-pro",
          "displayName": "[Tongyi] DeepSeek V4 Pro",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "tongyi/deepseek-v4-pro-0813",
          "apiModel": "tongyi/deepseek-v4-pro-0813",
          "displayName": "[Tongyi] DeepSeek V4 Pro 0813",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "volcengine_maas/deepseek-r1-250528",
          "apiModel": "volcengine_maas/deepseek-r1-250528",
          "displayName": "[Volc] DeepSeek-R1 · 250528",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 128000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "volcengine_maas/deepseek-v3-250324",
          "apiModel": "volcengine_maas/deepseek-v3-250324",
          "displayName": "[Volc] DeepSeek V3 · 250324",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 128000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "volcengine_maas/deepseek-v4-flash",
          "apiModel": "volcengine_maas/deepseek-v4-flash",
          "displayName": "[Volc] DeepSeek V4 Flash",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "volcengine_maas/deepseek-v4-pro",
          "apiModel": "volcengine_maas/deepseek-v4-pro",
          "displayName": "[Volc] DeepSeek V4 Pro",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "xiaomi/deepseek-v3.1",
          "apiModel": "xiaomi/deepseek-v3.1",
          "displayName": "[Xiaomi] DeepSeek V3.1",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 128000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "xiaomi/DeepSeek-R1-0528",
          "apiModel": "xiaomi/DeepSeek-R1-0528",
          "displayName": "[Xiaomi] DeepSeek R1 0528",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": false,
          "supportsImages": false,
          "contextTokenLimit": 163840,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "xiaomi/mimo-v2-omni",
          "apiModel": "xiaomi/mimo-v2-omni",
          "displayName": "[Xiaomi] MiMo V2 Omni",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 262144,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "xiaomi/mimo-v2.5",
          "apiModel": "xiaomi/mimo-v2.5",
          "displayName": "[Xiaomi] MiMo-V2.5",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 1048576,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "xiaomi/mimo-v2.5-pro",
          "apiModel": "xiaomi/mimo-v2.5-pro",
          "displayName": "[Xiaomi] MiMo-V2.5-Pro",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 1048576,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "xiaomi/mimo-x-flash-preview",
          "apiModel": "xiaomi/mimo-x-flash-preview",
          "displayName": "[Xiaomi] Mimo X Flash Preview",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 128000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "xiaomi/mimo-x-pro-preview",
          "apiModel": "xiaomi/mimo-x-pro-preview",
          "displayName": "[Xiaomi] Mimo X Pro Preview",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 128000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5-chat",
          "apiModel": "azure_openai/gpt-5-chat",
          "displayName": "[Azure] GPT-5 Chat",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5-mini",
          "apiModel": "azure_openai/gpt-5-mini",
          "displayName": "[Azure] GPT-5 Mini",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5-nano",
          "apiModel": "azure_openai/gpt-5-nano",
          "displayName": "[Azure] GPT-5 Nano",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.2-2",
          "apiModel": "azure_openai/gpt-5.2-2",
          "displayName": "[Azure] GPT-5.2 · 2",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.2-3",
          "apiModel": "azure_openai/gpt-5.2-3",
          "displayName": "[Azure] GPT-5.2 · 3",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.2-4",
          "apiModel": "azure_openai/gpt-5.2-4",
          "displayName": "[Azure] GPT-5.2 · 4",
          "thinking": false,
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "tongyi/deepseek-v4.1-flash",
          "apiModel": "tongyi/deepseek-v4.1-flash",
          "displayName": "[Tongyi] DeepSeek V4.1 Flash",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 1000000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "xiaomi/mimo-v2.6-flash",
          "apiModel": "xiaomi/mimo-v2.6-flash",
          "displayName": "[Xiaomi] MiMo-V2.6-Flash",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 1048576,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "xiaomi/mimo-v2.6-pro",
          "apiModel": "xiaomi/mimo-v2.6-pro",
          "displayName": "[Xiaomi] MiMo-V2.6-Pro",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 1048576,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "xiaomi/mimo-v2.6-pro-ultraspeed",
          "apiModel": "xiaomi/mimo-v2.6-pro-ultraspeed",
          "displayName": "[Xiaomi] MiMo-V2.6-Pro-Ultraspeed",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": false,
          "contextTokenLimit": 1048576,
          "maxOutputTokens": 32000,
          "defaultOn": true
        }
      ]
    },
    {
      "id": "mioffice-openai",
      "name": "Mioffice · OpenAI Responses",
      "type": "openai-responses",
      "baseUrl": "https://api.llm.mioffice.cn/v1",
      "auth": {
        "kind": "token",
        "value": ""
      },
      "models": [
        {
          "id": "azure_openai/gpt-5-codex",
          "apiModel": "azure_openai/gpt-5-codex",
          "displayName": "[Azure] GPT-5-Codex",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5-codex-2",
          "apiModel": "azure_openai/gpt-5-codex-2",
          "displayName": "[Azure] GPT-5-Codex · 2",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5-codex-4",
          "apiModel": "azure_openai/gpt-5-codex-4",
          "displayName": "[Azure] GPT-5-Codex · 4",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5-codex-5",
          "apiModel": "azure_openai/gpt-5-codex-5",
          "displayName": "[Azure] GPT-5-Codex · 5",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.1-codex",
          "apiModel": "azure_openai/gpt-5.1-codex",
          "displayName": "[Azure] GPT-5.1 Codex",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.1-codex-3",
          "apiModel": "azure_openai/gpt-5.1-codex-3",
          "displayName": "[Azure] GPT-5.1 Codex · 3",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.1-codex-5",
          "apiModel": "azure_openai/gpt-5.1-codex-5",
          "displayName": "[Azure] GPT-5.1 Codex · 5",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.1-codex-7",
          "apiModel": "azure_openai/gpt-5.1-codex-7",
          "displayName": "[Azure] GPT-5.1 Codex · 7",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.1-codex-max",
          "apiModel": "azure_openai/gpt-5.1-codex-max",
          "displayName": "[Azure] GPT-5.1 Codex Max",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.1-codex-max-5",
          "apiModel": "azure_openai/gpt-5.1-codex-max-5",
          "displayName": "[Azure] GPT-5.1 Codex Max · 5",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.1-codex-max-8",
          "apiModel": "azure_openai/gpt-5.1-codex-max-8",
          "displayName": "[Azure] GPT-5.1 Codex Max · 8",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.1-codex-mini",
          "apiModel": "azure_openai/gpt-5.1-codex-mini",
          "displayName": "[Azure] GPT-5.1 Codex mini",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.2-codex",
          "apiModel": "azure_openai/gpt-5.2-codex",
          "displayName": "[Azure] GPT-5.2 Codex",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.2-codex-1",
          "apiModel": "azure_openai/gpt-5.2-codex-1",
          "displayName": "[Azure] GPT-5.2 Codex · 1",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.2-codex-3",
          "apiModel": "azure_openai/gpt-5.2-codex-3",
          "displayName": "[Azure] GPT-5.2 Codex · 3",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.2-codex-4",
          "apiModel": "azure_openai/gpt-5.2-codex-4",
          "displayName": "[Azure] GPT-5.2 Codex · 4",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.2-codex-5",
          "apiModel": "azure_openai/gpt-5.2-codex-5",
          "displayName": "[Azure] GPT-5.2 Codex · 5",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.2-codex-6",
          "apiModel": "azure_openai/gpt-5.2-codex-6",
          "displayName": "[Azure] GPT-5.2 Codex · 6",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.2-codex-7",
          "apiModel": "azure_openai/gpt-5.2-codex-7",
          "displayName": "[Azure] GPT-5.2 Codex · 7",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.2-codex-8",
          "apiModel": "azure_openai/gpt-5.2-codex-8",
          "displayName": "[Azure] GPT-5.2 Codex · 8",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.2-codex-9",
          "apiModel": "azure_openai/gpt-5.2-codex-9",
          "displayName": "[Azure] GPT-5.2 Codex · 9",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.3-codex",
          "apiModel": "azure_openai/gpt-5.3-codex",
          "displayName": "[Azure] GPT-5.3 Codex",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.3-codex-1",
          "apiModel": "azure_openai/gpt-5.3-codex-1",
          "displayName": "[Azure] GPT-5.3 Codex · 1",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.3-codex-2",
          "apiModel": "azure_openai/gpt-5.3-codex-2",
          "displayName": "[Azure] GPT-5.3 Codex · 2",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.3-codex-3",
          "apiModel": "azure_openai/gpt-5.3-codex-3",
          "displayName": "[Azure] GPT-5.3 Codex · 3",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.3-codex-4",
          "apiModel": "azure_openai/gpt-5.3-codex-4",
          "displayName": "[Azure] GPT-5.3 Codex · 4",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.3-codex-5",
          "apiModel": "azure_openai/gpt-5.3-codex-5",
          "displayName": "[Azure] GPT-5.3 Codex · 5",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.3-codex-6",
          "apiModel": "azure_openai/gpt-5.3-codex-6",
          "displayName": "[Azure] GPT-5.3 Codex · 6",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.3-codex-7",
          "apiModel": "azure_openai/gpt-5.3-codex-7",
          "displayName": "[Azure] GPT-5.3 Codex · 7",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.3-codex-8",
          "apiModel": "azure_openai/gpt-5.3-codex-8",
          "displayName": "[Azure] GPT-5.3 Codex · 8",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5.3-codex-9",
          "apiModel": "azure_openai/gpt-5.3-codex-9",
          "displayName": "[Azure] GPT-5.3 Codex · 9",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-5-pro",
          "apiModel": "azure_openai/gpt-5-pro",
          "displayName": "[Azure] GPT-5 Pro",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        },
        {
          "id": "azure_openai/gpt-6-astra",
          "apiModel": "azure_openai/gpt-6-astra",
          "displayName": "[Azure] GPT-6 Astra",
          "thinking": true,
          "thinkingLevel": "high",
          "supportsAgent": true,
          "supportsImages": true,
          "contextTokenLimit": 400000,
          "maxOutputTokens": 32000,
          "defaultOn": true
        }
      ]
    }
  ]
};

export const MODELS_CATALOG_FILE_NAME = 'models-catalog.json';
export const WEB_TOOLS_FILE_NAME = 'web-tools.json';

export const DEFAULT_WEB_TOOLS = {
  $schemaVersion: 1,
  search: {
    providers: [
      { id: 'default-ddg', type: 'duckduckgo', enabled: true },
      { id: 'default-exa', type: 'exa', enabled: false },
      { id: 'default-tavily', type: 'tavily', enabled: false },
      { id: 'default-brave', type: 'brave', enabled: false },
      { id: 'default-jina', type: 'jina', enabled: false },
      { id: 'default-firecrawl', type: 'firecrawl', enabled: false },
    ],
    parallel: false,
    maxResults: 10,
  },
  fetch: {
    provider: 'builtin',
  },
};
