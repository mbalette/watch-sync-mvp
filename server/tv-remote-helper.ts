import http from "node:http";
import { execFile } from "node:child_process";
import {
  adbConnectArgs,
  adbMediaKeyForDeviceArgs,
  assertAdbMediaKey,
} from "./adb-helper-remote";
import { getRokuDeviceInfo, sendRokuKeypress } from "./tv-remote";
import { pairLgWebOs, sendLgWebOsMediaCommand } from "./lg-webos-remote";
import { pairSamsungTv, sendSamsungKeypress } from "./samsung-tizen-remote";
import {
  getSonyRemoteControllerInfo,
  sendSonyIrcc,
} from "./sony-bravia-remote";
import { sendPhilipsJointSpaceKey } from "./philips-jointspace-remote";
import {
  confirmVizioPairing,
  sendVizioSmartCastKey,
  startVizioPairing,
} from "./vizio-smartcast-remote";
import {
  TV_REMOTE_TARGETS,
  helperAdvertisedTargets,
  uiVisibleTargets,
} from "./tv-remote-targets";

const port = Number(process.env.TV_REMOTE_HELPER_PORT ?? 8790);

export interface TvRemoteHelperDeps {
  getRokuDeviceInfo?: typeof getRokuDeviceInfo;
  sendRokuKeypress?: typeof sendRokuKeypress;
  pairLgWebOs?: typeof pairLgWebOs;
  sendLgWebOsMediaCommand?: typeof sendLgWebOsMediaCommand;
  pairSamsungTv?: typeof pairSamsungTv;
  sendSamsungKeypress?: typeof sendSamsungKeypress;
  getSonyRemoteControllerInfo?: typeof getSonyRemoteControllerInfo;
  sendSonyIrcc?: typeof sendSonyIrcc;
  sendPhilipsJointSpaceKey?: typeof sendPhilipsJointSpaceKey;
  sendVizioSmartCastKey?: typeof sendVizioSmartCastKey;
  startVizioPairing?: typeof startVizioPairing;
  confirmVizioPairing?: typeof confirmVizioPairing;
  sendHomeAssistantWebhook?: typeof sendHomeAssistantWebhook;
  runAdb?: AdbRunner;
}

export function createTvRemoteHelperServer(deps: TvRemoteHelperDeps = {}) {
  const getDeviceInfo = deps.getRokuDeviceInfo ?? getRokuDeviceInfo;
  const sendKeypress = deps.sendRokuKeypress ?? sendRokuKeypress;
  const pairLg = deps.pairLgWebOs ?? pairLgWebOs;
  const sendLgMedia = deps.sendLgWebOsMediaCommand ?? sendLgWebOsMediaCommand;
  const pairSamsung = deps.pairSamsungTv ?? pairSamsungTv;
  const sendSamsung = deps.sendSamsungKeypress ?? sendSamsungKeypress;
  const getSonyInfo =
    deps.getSonyRemoteControllerInfo ?? getSonyRemoteControllerInfo;
  const sendSony = deps.sendSonyIrcc ?? sendSonyIrcc;
  const sendPhilips = deps.sendPhilipsJointSpaceKey ?? sendPhilipsJointSpaceKey;
  const sendVizio = deps.sendVizioSmartCastKey ?? sendVizioSmartCastKey;
  const startVizio = deps.startVizioPairing ?? startVizioPairing;
  const confirmVizio = deps.confirmVizioPairing ?? confirmVizioPairing;
  const sendHaWebhook =
    deps.sendHomeAssistantWebhook ?? sendHomeAssistantWebhook;
  const runAdb = deps.runAdb ?? runAdbCommand;

  return http.createServer(async (req, res) => {
    if (!isAllowedOrigin(req, res)) return;
    setCors(req, res);
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    try {
      const url = new URL(
        req.url ?? "/",
        `http://${req.headers.host ?? "127.0.0.1"}`,
      );

      if (req.method === "GET" && url.pathname === "/health") {
        sendJson(res, 200, {
          ok: true,
          service: "watch-sync-tv-remote-helper",
          targets: helperAdvertisedTargets(),
          availableTargets: uiVisibleTargets().map(
            ({
              id,
              label,
              priority,
              protocolStatus,
              hardwareValidated,
              safeClaim,
            }) => ({
              id,
              label,
              priority,
              protocolStatus,
              hardwareValidated,
              safeClaim,
            }),
          ),
        });
        return;
      }

      if (req.method === "GET" && url.pathname === "/targets") {
        sendJson(res, 200, { ok: true, targets: TV_REMOTE_TARGETS });
        return;
      }

      if (req.method === "GET" && url.pathname === "/roku/device-info") {
        const host = url.searchParams.get("host") ?? "";
        const device = await getDeviceInfo(host);
        sendJson(res, 200, { ok: true, device });
        return;
      }

      if (req.method === "POST" && url.pathname === "/roku/keypress") {
        const body = await readJson(req);
        await sendKeypress(String(body.host ?? ""), String(body.key ?? ""));
        sendJson(res, 200, { ok: true });
        return;
      }

      if (
        req.method === "POST" &&
        (url.pathname === "/lg-webos/pair" ||
          url.pathname === "/lg/pair/start" ||
          url.pathname === "/lg/pair/confirm")
      ) {
        const body = await readJson(req);
        const result = await pairLg(String(body.host ?? ""), {
          url: optionalBodyString(body.url),
          timeoutMs: optionalBodyNumber(body.timeoutMs),
          appName: optionalBodyString(body.appName),
          appId: optionalBodyString(body.appId),
        });
        sendJson(res, 200, {
          ok: true,
          platform: "lg-webos-experimental",
          clientKey: result.clientKey,
        });
        return;
      }

      if (
        req.method === "POST" &&
        (url.pathname === "/lg-webos/media" || url.pathname === "/lg/keypress")
      ) {
        const body = await readJson(req);
        await sendLgMedia(String(body.host ?? ""), String(body.command ?? ""), {
          url: optionalBodyString(body.url),
          timeoutMs: optionalBodyNumber(body.timeoutMs),
          appName: optionalBodyString(body.appName),
          appId: optionalBodyString(body.appId),
          clientKey: String(body.clientKey ?? ""),
        });
        sendJson(res, 200, { ok: true, platform: "lg-webos-experimental" });
        return;
      }

      if (
        req.method === "POST" &&
        (url.pathname === "/samsung/pair" ||
          url.pathname === "/samsung/pair/start" ||
          url.pathname === "/samsung/pair/confirm")
      ) {
        const body = await readJson(req);
        const result = await pairSamsung(String(body.host ?? ""), {
          url: optionalBodyString(body.url),
          port: optionalSamsungPort(body.port),
          token: optionalBodyString(body.token),
          appName: optionalBodyString(body.appName),
          timeoutMs: optionalBodyNumber(body.timeoutMs),
        });
        sendJson(res, 200, {
          ok: true,
          platform: "samsung-tizen-beta",
          ...result,
        });
        return;
      }

      if (req.method === "POST" && url.pathname === "/samsung/keypress") {
        const body = await readJson(req);
        await sendSamsung(String(body.host ?? ""), String(body.key ?? ""), {
          url: optionalBodyString(body.url),
          port: optionalSamsungPort(body.port),
          token: optionalBodyString(body.token),
          appName: optionalBodyString(body.appName),
          timeoutMs: optionalBodyNumber(body.timeoutMs),
        });
        sendJson(res, 200, { ok: true, platform: "samsung-tizen-beta" });
        return;
      }

      if (req.method === "POST" && url.pathname === "/adb/connect") {
        const body = await readJson(req);
        await runAdb(adbConnectArgs(String(body.host ?? "")));
        sendJson(res, 200, { ok: true, platform: "adb-helper-advanced" });
        return;
      }

      if (req.method === "POST" && url.pathname === "/adb/media-key") {
        const body = await readJson(req);
        const key = assertAdbMediaKey(String(body.key ?? ""));
        await runAdb(adbMediaKeyForDeviceArgs(String(body.host ?? ""), key));
        sendJson(res, 200, { ok: true, platform: "adb-helper-advanced", key });
        return;
      }

      if (
        req.method === "POST" &&
        (url.pathname === "/sony/remote-controller-info" ||
          url.pathname === "/sony/connect")
      ) {
        const body = await readJson(req);
        const result = await getSonyInfo(String(body.host ?? ""), {
          url: optionalBodyString(body.url),
          psk: optionalBodyString(body.psk),
          timeoutMs: optionalBodyNumber(body.timeoutMs),
        });
        sendJson(res, 200, { ok: true, platform: "sony-bravia-beta", result });
        return;
      }

      if (
        req.method === "POST" &&
        (url.pathname === "/sony/ircc" || url.pathname === "/sony/keypress")
      ) {
        const body = await readJson(req);
        await sendSony(String(body.host ?? ""), String(body.irccCode ?? ""), {
          url: optionalBodyString(body.url),
          psk: optionalBodyString(body.psk),
          timeoutMs: optionalBodyNumber(body.timeoutMs),
        });
        sendJson(res, 200, { ok: true, platform: "sony-bravia-beta" });
        return;
      }

      if (req.method === "POST" && url.pathname === "/philips/key") {
        const body = await readJson(req);
        await sendPhilips(String(body.host ?? ""), String(body.key ?? ""), {
          url: optionalBodyString(body.url),
          apiVersion: optionalBodyNumber(body.apiVersion),
          timeoutMs: optionalBodyNumber(body.timeoutMs),
        });
        sendJson(res, 200, {
          ok: true,
          platform: "philips-jointspace-experimental",
        });
        return;
      }

      if (req.method === "POST" && url.pathname === "/vizio/pair/start") {
        const body = await readJson(req);
        const result = await startVizio(String(body.host ?? ""), {
          url: optionalBodyString(body.url),
          timeoutMs: optionalBodyNumber(body.timeoutMs),
          deviceId: optionalBodyString(body.deviceId),
        });
        sendJson(res, 200, {
          ok: true,
          platform: "vizio-runtime-beta",
          pairingToken: result.pairingToken,
          challengeType: result.challengeType,
        });
        return;
      }

      if (req.method === "POST" && url.pathname === "/vizio/pair/confirm") {
        const body = await readJson(req);
        const result = await confirmVizio(
          String(body.host ?? ""),
          String(body.code ?? ""),
          {
            url: optionalBodyString(body.url),
            timeoutMs: optionalBodyNumber(body.timeoutMs),
            pairingToken: optionalBodyString(body.pairingToken),
            challengeType: optionalBodyString(body.challengeType),
            deviceId: optionalBodyString(body.deviceId),
          },
        );
        sendJson(res, 200, {
          ok: true,
          platform: "vizio-runtime-beta",
          authToken: result.authToken,
        });
        return;
      }

      if (
        req.method === "POST" &&
        (url.pathname === "/vizio/key" || url.pathname === "/vizio/keypress")
      ) {
        const body = await readJson(req);
        await sendVizio(String(body.host ?? ""), String(body.key ?? ""), {
          url: optionalBodyString(body.url),
          authToken: optionalBodyString(body.authToken),
          timeoutMs: optionalBodyNumber(body.timeoutMs),
        });
        sendJson(res, 200, { ok: true, platform: "vizio-runtime-beta" });
        return;
      }

      if (req.method === "POST" && url.pathname === "/home-assistant/webhook") {
        const body = await readJson(req);
        const result = await sendHaWebhook({
          webhookUrl: String(body.webhookUrl ?? ""),
          roomId: optionalBodyString(body.roomId),
          countdownId: optionalBodyString(body.countdownId),
          issuedAt: optionalBodyString(body.issuedAt),
          test: body.test === true,
        });
        sendJson(res, 200, {
          ok: true,
          platform: "home-assistant-webhook",
          status: result.status,
        });
        return;
      }

      sendJson(res, 404, { ok: false, error: "Not found" });
    } catch (error) {
      sendJson(res, 400, {
        ok: false,
        error:
          error instanceof Error ? error.message : "TV remote helper error",
      });
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const server = createTvRemoteHelperServer();
  server.listen(port, "127.0.0.1", () => {
    console.log(
      `Watch Sync TV Remote helper listening on http://127.0.0.1:${port}`,
    );
  });
}

interface HomeAssistantWebhookRequest {
  webhookUrl: string;
  roomId?: string;
  countdownId?: string;
  issuedAt?: string;
  test?: boolean;
}

interface HomeAssistantWebhookResult {
  status: number;
}

export async function sendHomeAssistantWebhook(
  input: HomeAssistantWebhookRequest,
): Promise<HomeAssistantWebhookResult> {
  const webhookUrl = parseSafeHttpWebhookUrl(input.webhookUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: input.test ? "watch_sync_test" : "watch_sync_go",
        room_id: input.roomId,
        countdown_id: input.countdownId,
        issued_at: input.issuedAt,
        client_ts: new Date().toISOString(),
      }),
      signal: controller.signal,
    });

    if (response.status < 200 || response.status >= 400) {
      throw new Error(`Home Assistant webhook returned ${response.status}`);
    }
    return { status: response.status };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError")
      throw new Error("Home Assistant webhook timed out", { cause: error });
    if (
      error instanceof Error &&
      error.message.startsWith("Home Assistant webhook returned ")
    )
      throw error;
    if (
      error instanceof Error &&
      error.message.startsWith("Home Assistant webhook URL ")
    )
      throw error;
    throw new Error("Home Assistant webhook request failed", { cause: error });
  } finally {
    clearTimeout(timeout);
  }
}

function parseSafeHttpWebhookUrl(value: string): string {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(
      "Home Assistant webhook URL must be a valid http:// or https:// URL",
    );
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Home Assistant webhook URL must use http:// or https://");
  }
  if (!parsed.hostname) {
    throw new Error("Home Assistant webhook URL must include a hostname");
  }
  if (parsed.username || parsed.password) {
    throw new Error(
      "Home Assistant webhook URL must not include embedded credentials",
    );
  }
  return parsed.toString();
}

function isAllowedOrigin(
  req: http.IncomingMessage,
  res: http.ServerResponse,
): boolean {
  const origin = req.headers.origin;
  if (!origin) return true;
  if (typeof origin !== "string" || !allowedBrowserOrigin(origin)) {
    sendJson(res, 403, {
      ok: false,
      error: "TV remote helper rejected this browser origin.",
    });
    return false;
  }
  return true;
}

function setCors(req: http.IncomingMessage, res: http.ServerResponse) {
  const origin =
    typeof req.headers.origin === "string" &&
    allowedBrowserOrigin(req.headers.origin)
      ? req.headers.origin
      : "https://app.kyrosdirect.tech";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Private-Network", "true");
}

function allowedBrowserOrigin(origin: string): boolean {
  const configured = (process.env.TV_REMOTE_HELPER_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (configured.includes(origin)) return true;
  try {
    const parsed = new URL(origin);
    if (
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
      (parsed.protocol === "http:" || parsed.protocol === "https:")
    )
      return true;
    if (
      parsed.protocol === "https:" &&
      (parsed.hostname === "app.kyrosdirect.tech" ||
        parsed.hostname === "321play.kyrosdirect.tech")
    )
      return true;
    if (
      parsed.protocol === "https:" &&
      parsed.hostname.endsWith(".watch-sync-mvp.pages.dev")
    )
      return true;
  } catch {
    return false;
  }
  return false;
}

function sendJson(res: http.ServerResponse, status: number, payload: unknown) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readJson(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body) as Record<string, unknown>);
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

interface AdbRunResult {
  stdout: string;
  stderr: string;
}

type AdbRunner = (args: string[]) => Promise<AdbRunResult>;

function runAdbCommand(args: string[]): Promise<AdbRunResult> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      "adb",
      args,
      { timeout: 4000, windowsHide: true },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error("ADB command failed or timed out", { cause: error }),
          );
          return;
        }
        resolve({ stdout, stderr });
      },
    );
    child.stdin?.end();
  });
}

function optionalBodyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value
    : undefined;
}

function optionalBodyNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function optionalSamsungPort(value: unknown): 8001 | 8002 | undefined {
  if (value === 8001 || value === 8002) return value;
  return undefined;
}
