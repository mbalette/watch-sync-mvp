export type DemoId =
  | "01-landing"
  | "02-step1-photo-id"
  | "03-photo-bottom-sheet"
  | "04-manual-step1-category"
  | "05-manual-step2-device-picker"
  | "06-manual-step3-roku-setup"
  | "07-result-success"
  | "08-result-failed"
  | "09-apple-tv-steer"
  | "10-countdown-auto-play"
  | "11-countdown-no-auto-play"
  | "12-watch-tracker-free"
  | "13-watch-tracker-pro"
  | "14-paywall-session-6"
  | "15-post-session-title-prompt";

export const DEMO_IDS: DemoId[] = [
  "01-landing",
  "02-step1-photo-id",
  "03-photo-bottom-sheet",
  "04-manual-step1-category",
  "05-manual-step2-device-picker",
  "06-manual-step3-roku-setup",
  "07-result-success",
  "08-result-failed",
  "09-apple-tv-steer",
  "10-countdown-auto-play",
  "11-countdown-no-auto-play",
  "12-watch-tracker-free",
  "13-watch-tracker-pro",
  "14-paywall-session-6",
  "15-post-session-title-prompt",
];

export function isDemoId(value: string | null): value is DemoId {
  return Boolean(value) && DEMO_IDS.includes(value as DemoId);
}
