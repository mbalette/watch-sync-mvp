import { describe, expect, it } from "vitest";
import { selectAppSurface } from "./app-surface";

function params(query: string) {
  return new URLSearchParams(query);
}

describe("App surface routing", () => {
  it("uses the integrated live app by default so native TVRemote wiring is in the main app", () => {
    expect(selectAppSurface(params(""))).toBe("live");
  });

  it("keeps room links on the live app", () => {
    expect(selectAppSurface(params("room=ABC123"))).toBe("live");
    expect(selectAppSurface(params("realtime=1"))).toBe("live");
  });

  it("keeps visual flow behind explicit demo flags", () => {
    expect(selectAppSurface(params("flow=1"))).toBe("flow");
    expect(selectAppSurface(params("visualFlow=1"))).toBe("flow");
    expect(selectAppSurface(params("visual=1"))).toBe("flow");
  });

  it("keeps reference screens behind the existing demo route", () => {
    expect(selectAppSurface(params("demo=01-landing"))).toBe("reference");
  });
});
