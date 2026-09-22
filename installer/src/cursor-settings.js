/**
 * Cursor 用户 settings.json 修补 — 强制 agent 传输走 HTTP/1.1
 *
 * 背景:
 *   Cursor 3.21+ 的 agent 传输对 localhost 也发 HTTP/2 (repo/cpp/cmdk 都有
 *   .cursor.sh 判断, 唯独 agent 那条没有), 撞上只讲 HTTP/1.1 的 BYOK 服务器
 *   → ERR_HTTP2_ERROR "Protocol error" → 聊天框报 "An unexpected error occurred"。
 *
 *   扩展侧已修: buildServerConfig() 返回 http2Config=FORCE_ALL_DISABLED。
 *   但客户端读的是落盘缓存 (getCachedServerConfigJson → state.vscdb 的
 *   cursorai/serverConfig), 扩展宿主启动那一瞬间 workbench 还没把磁盘值载入内存,
 *   读到空默认值 → 回落 HTTP/2; 之后每 10 分钟才重查一次。表现为
 *   "刚装好/刚重启就连不上, 放一会儿又自己好了"。
 *
 *   cursor.general.disableHttp2 是唯一同步读取、不吃缓存的路径
 *   (isHttp2Disabled() 直接读 workspace configuration), 所以这里兜底写入。
 *
 * 注意:
 *   - 必须在 Cursor 关闭时写入。Cursor 运行中会把内存里的旧副本写回整个文件,
 *     覆盖掉这里的改动 (判定式第三分支 "非 FORCE_*_ENABLED && isHttp2Disabled()"
 *     同样生效, 所以两处修复互补)。
 *   - settings.json 是 JSONC (允许注释/尾逗号), 不能用 JSON.parse 直接读。
 *   - 回写采用"文本插入/替换"而非 JSON 序列化, 以保留用户的注释与排版。
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { execFileSync } from 'child_process';
import { homedir } from 'os';
import { join } from 'path';
import { createBackup } from './backup.js';

export const HTTP2_SETTING_KEY = 'cursor.general.disableHttp2';
const BACKUP_TAG = 'cursor-settings';

/** Cursor 用户数据目录 (<User>/) — 与 release-defaults 的 state.vscdb 同源 */
export function getCursorUserDir() {
  const home = homedir();
  switch (process.platform) {
    case 'darwin':
      return join(home, 'Library', 'Application Support', 'Cursor', 'User');
    case 'win32':
      return join(process.env.APPDATA || join(home, 'AppData', 'Roaming'), 'Cursor', 'User');
    case 'linux':
      return join(process.env.XDG_CONFIG_HOME || join(home, '.config'), 'Cursor', 'User');
    default:
      return join(home, '.config', 'Cursor', 'User');
  }
}

export function getCursorSettingsPath() {
  return join(getCursorUserDir(), 'settings.json');
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 文本里该项是否已为 true (不解析 JSONC, 只看键值对) */
function hasHttp2Disabled(raw) {
  return new RegExp(`"${escapeRe(HTTP2_SETTING_KEY)}"\\s*:\\s*true`).test(raw);
}

/** 当前设置状态: true=已设置 / false=未设置 / null=settings.json 不存在 */
export function isHttp2DisabledSet() {
  const file = getCursorSettingsPath();
  if (!existsSync(file)) return null;
  return hasHttp2Disabled(readFileSync(file, 'utf-8'));
}

/**
 * JSONC → JSON 文本 (去注释、去尾逗号, 字符串字面量内不动)。
 * 只用于写入前的校验, 不用它回写 —— 回写要保留用户原有排版。
 */
function stripJsonc(text) {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (c === '"') {
      // 字符串: 原样搬, 处理转义
      out += c;
      i++;
      while (i < text.length) {
        out += text[i];
        if (text[i] === '\\') { out += text[i + 1] ?? ''; i += 2; continue; }
        if (text[i] === '"') { i++; break; }
        i++;
      }
      continue;
    }
    if (c === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && text[i + 1] === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (c === ',') {
      // 尾逗号: 后面第一个非空白字符是 } 或 ] 就丢掉
      let j = i + 1;
      while (j < text.length && /\s/.test(text[j])) j++;
      if (text[j] === '}' || text[j] === ']') { i++; continue; }
    }
    out += c;
    i++;
  }
  return out;
}

function isValidJsonc(text) {
  const stripped = stripJsonc(text).replace(/^﻿/, '').trim();
  if (stripped === '') return true;
  try {
    JSON.parse(stripped);
    return true;
  }
  catch {
    return false;
  }
}

/** 在 JSONC 文本里插入/替换一个布尔键, 保留其余排版 */
function upsertBoolean(raw, key, value) {
  const keyRe = new RegExp(`"${escapeRe(key)}"(\\s*:\\s*)(true|false)`);
  if (keyRe.test(raw)) {
    return { text: raw.replace(keyRe, `"${key}"$1${value}`), changed: true };
  }

  const line = `"${key}": ${value}`;
  const open = raw.indexOf('{');
  if (open === -1) {
    // 空文件或非对象内容 → 整体重写
    return { text: `{\n  ${line}\n}\n`, changed: true };
  }
  const close = raw.lastIndexOf('}');
  const body = raw.slice(open + 1, close === -1 ? raw.length : close).trim();
  if (body === '') {
    // {} 空对象
    return { text: `${raw.slice(0, open + 1)}\n  ${line}\n${raw.slice(close)}`, changed: true };
  }
  return { text: `${raw.slice(0, open + 1)}\n  ${line},${raw.slice(open + 1)}`, changed: true };
}

/** Cursor 是否在运行 — 运行中写入会被内存副本覆盖, 需要提醒 */
function isCursorRunning() {
  try {
    if (process.platform === 'win32') {
      const out = execFileSync('tasklist', ['/FI', 'IMAGENAME eq Cursor.exe', '/NH'], {
        encoding: 'utf-8',
        timeout: 5000,
        windowsHide: true,
      });
      return /cursor\.exe/i.test(out);
    }
    execFileSync('pgrep', ['-x', 'Cursor'], { stdio: 'ignore', timeout: 5000 });
    return true;
  }
  catch {
    // pgrep 退出码 1 = 没找到; 命令本身不可用也按"未运行"处理, 不阻塞安装
    return false;
  }
}

/**
 * 确保 cursor.general.disableHttp2 = true。
 * 幂等: 已是 true 则跳过。返回是否真的改动了文件。
 *
 * 不参与 uninstall 的整体还原 —— 备份是"首次安装前"的快照, 卸载时还原会把
 * 用户在安装之后改的其他设置一并冲掉。取消安装后这个设置留着也无害
 * (只是强制 HTTP/1.1), 由 uninstall 打印提示让用户自行决定。
 */
export function ensureHttp2Disabled(log) {
  const file = getCursorSettingsPath();
  if (!existsSync(file)) {
    log?.('  settings.json not found — skip (Cursor 还没启动过?)');
    return false;
  }

  const raw = readFileSync(file, 'utf-8');
  if (hasHttp2Disabled(raw)) {
    log?.(`  ${HTTP2_SETTING_KEY} already true — skip`);
    return false;
  }

  const { text } = upsertBoolean(raw, HTTP2_SETTING_KEY, true);
  if (!isValidJsonc(text)) {
    log?.('  settings.json 写入后校验不通过 — 放弃修改 (保持原文件)');
    return false;
  }

  createBackup(file, BACKUP_TAG, log);
  writeFileSync(file, text, 'utf-8');
  log?.(`  ${HTTP2_SETTING_KEY} = true (agent 传输强制 HTTP/1.1)`);

  if (isCursorRunning()) {
    log?.('  WARNING: Cursor 正在运行 — 该改动可能稍后被 Cursor 内存副本覆盖');
    log?.('           建议关闭 Cursor 后重跑 install, 或在设置里手动确认该项为勾选');
  }
  return true;
}

/** uninstall 时提示 (不还原, 理由见 ensureHttp2Disabled 注释) */
export function noteHttp2Setting(log) {
  if (isHttp2DisabledSet() !== true) return;
  log?.(`  注意: ${HTTP2_SETTING_KEY} 仍为 true (强制 HTTP/1.1, 无害)`);
  log?.('        如需移除请手动编辑 Cursor 设置, 或参考备份 settings.json.backup-byok-cursor-settings-*');
}