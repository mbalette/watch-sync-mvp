import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { sanitizeLanHost } from "./tv-remote-utils";

export type VizioSmartCastKey = "play" | "pause";

export interface VizioSmartCastOptions {
  url?: string;
  authToken?: string;
  timeoutMs?: number;
  pairingToken?: string;
  challengeType?: string;
  deviceId?: string;
}

export interface VizioPairStartResult {
  pairingToken?: string;
  challengeType?: string;
  raw?: unknown;
}

export interface VizioPairConfirmResult {
  authToken?: string;
  raw?: unknown;
}

const VIZIO_CODES: Record<
  VizioSmartCastKey,
  { CODESET: number; CODE: number; ACTION: "KEYPRESS" }
> = {
  play: { CODESET: 2, CODE: 3, ACTION: "KEYPRESS" },
  pause: { CODESET: 2, CODE: 2, ACTION: "KEYPRESS" },
};

export function assertVizioSmartCastKey(key: string): VizioSmartCastKey {
  if (key === "play" || key === "pause") return key;
  throw new Error(`Unsupported Vizio SmartCast key: ${key}`);
}

export function vizioSmartCastBaseUrl(
  hostInput: string,
  options: VizioSmartCastOptions = {},
): string {
  if (options.url) {
    const parsed = new URL(options.url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      throw new Error("Vizio SmartCast URL must use http:// or https://.");
    return parsed.toString().replace(/\/$/, "");
  }
  return `https://${sanitizeLanHost(hostInput)}:7345`;
}

export function vizioKeyCommandBody(keyInput: string): Record<string, unknown> {
  const key = assertVizioSmartCastKey(keyInput);
  return { KEYLIST: [VIZIO_CODES[key]] };
}

export async function startVizioPairing(
  hostInput: string,
  options: VizioSmartCastOptions = {},
): Promise<VizioPairStartResult> {
  const response = await jsonPutForResult(
    `${vizioSmartCastBaseUrl(hostInput, options)}/pairing/start`,
    {
      DEVICE_ID: options.deviceId ?? "watch-sync-helper",
      DEVICE_NAME: "321 Play",
    },
    options,
  );
  return {
    pairingToken:
      stringFromNested(response, ["ITEM", "PAIRING_REQ_TOKEN"]) ??
      stringFromNested(response, ["PAIRING_REQ_TOKEN"]),
    challengeType:
      stringFromNested(response, ["ITEM", "CHALLENGE_TYPE"]) ??
      stringFromNested(response, ["CHALLENGE_TYPE"]),
    raw: response,
  };
}

export async function confirmVizioPairing(
  hostInput: string,
  code: string,
  options: VizioSmartCastOptions = {},
): Promise<VizioPairConfirmResult> {
  const response = await jsonPutForResult(
    `${vizioSmartCastBaseUrl(hostInput, options)}/pairing/pair`,
    {
      DEVICE_ID: options.deviceId ?? "watch-sync-helper",
      CHALLENGE_TYPE: numberOrStringFrom(options.challengeType ?? "1"),
      RESPONSE_VALUE: code,
      PAIRING_REQ_TOKEN: numberOrStringFrom(options.pairingToken),
    },
    options,
  );
  return {
    authToken:
      stringFromNested(response, ["ITEM", "AUTH_TOKEN"]) ??
      stringFromNested(response, ["AUTH_TOKEN"]),
    raw: response,
  };
}

export async function sendVizioSmartCastKey(
  hostInput: string,
  keyInput: string,
  options: VizioSmartCastOptions = {},
): Promise<void> {
  await jsonPut(
    `${vizioSmartCastBaseUrl(hostInput, options)}/key_command/`,
    vizioKeyCommandBody(keyInput),
    options,
  );
}

async function jsonPut(
  urlString: string,
  body: unknown,
  options: VizioSmartCastOptions,
): Promise<void> {
  await jsonPutForResult(urlString, body, options);
}

async function jsonPutForResult(
  urlString: string,
  body: unknown,
  options: VizioSmartCastOptions,
): Promise<unknown> {
  const url = new URL(urlString);
  const transport = url.protocol === "https:" ? httpsRequest : httpRequest;
  const payload = JSON.stringify(body);
  return await new Promise<unknown>((resolve, reject) => {
    const req = transport(
      {
        hostname: url.hostname,
        port: url.port ? Number(url.port) : undefined,
        path: `${url.pathname}${url.search}`,
        method: "PUT",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          "Content-Length": Buffer.byteLength(payload),
          ...(options.authToken ? { AUTH: options.authToken } : {}),
        },
        timeout: options.timeoutMs ?? 3000,
        rejectUnauthorized: shouldVerifyVizioTls(url.hostname),
      },
      (res) => {
        let responseBody = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          responseBody += chunk;
        });
        res.on("end", () => {
          if (
            !res.statusCode ||
            res.statusCode < 200 ||
            res.statusCode >= 300
          ) {
            reject(
              new Error(
                `VIZIO TV returned HTTP ${res.statusCode ?? "unknown"}`,
              ),
            );
            return;
          }
          try {
            resolve(assertVizioStatusSuccess(parseMaybeJson(responseBody)));
          } catch (error) {
            reject(error);
          }
        });
      },
    );
    req.on("timeout", () =>
      req.destroy(new Error("Vizio SmartCast request timed out.")),
    );
    req.on("error", reject);
    req.end(payload);
  });
}

function shouldVerifyVizioTls(host: string): boolean {
  return !isPrivateLanHost(host);
}

function numberOrStringFrom(value: string | undefined): number | string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
  return trimmed;
}

function isPrivateLanHost(host: string): boolean {
  const lower = host.toLowerCase();
  if (
    lower === "localhost" ||
    lower === "127.0.0.1" ||
    lower.endsWith(".local")
  )
    return true;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(lower)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(lower)) return true;
  const match = lower.match(/^172\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  return Boolean(match && Number(match[1]) >= 16 && Number(match[1]) <= 31);
}

function parseMaybeJson(text: string): unknown {
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

function assertVizioStatusSuccess(value: unknown): unknown {
  const result = stringFromNested(value, ["STATUS", "RESULT"]);
  if (!result || result.toUpperCase() === "SUCCESS") return value;
  const detail = stringFromNested(value, ["STATUS", "DETAIL"]);
  throw new Error(
    `VIZIO TV returned ${result}${detail ? `: ${detail}` : ""}`,
  );
}

function stringFromNested(value: unknown, path: string[]): string | undefined {
  let current: unknown = value;
  for (const key of path) {
    if (!current || typeof current !== "object" || !(key in current))
      return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  if (typeof current === "string") return current;
  if (typeof current === "number" && Number.isFinite(current)) return String(current);
  return undefined;
}
