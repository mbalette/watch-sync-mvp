import { isDemoId } from "./reference-screens-ids";

export type AppSurface = "reference" | "flow" | "live";

export function selectAppSurface(params: URLSearchParams): AppSurface {
  if (isDemoId(params.get("demo"))) return "reference";
  if (
    params.get("flow") === "1" ||
    params.get("visualFlow") === "1" ||
    params.get("visual") === "1"
  )
    return "flow";
  return "live";
}
