/**
 * Reference-faithful standalone screens for proof capture.
 * Mirror the 321 Play export PNGs in /apps/321play/321Play--Exports/dark.
 * Visual-only. No backend wiring, no payment wiring, no hardware control.
 */

import "./reference-screens.css";
import type { DemoId } from "./reference-screens-ids";

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="ref-progress-dots" aria-hidden="true">
      {Array.from({ length: total }, (_, index) => {
        const state =
          index < current ? "done" : index === current ? "now" : "next";
        return <span key={index} className={`ref-dot ${state}`} />;
      })}
    </div>
  );
}

function CameraGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="ref-glyph" aria-hidden="true">
      <path
        d="M4 8.5A2.5 2.5 0 0 1 6.5 6h2.2l1.05-1.4A1.5 1.5 0 0 1 10.95 4h2.1c.47 0 .92.22 1.2.6L15.3 6h2.2A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="13"
        r="3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function PhotosGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="ref-glyph" aria-hidden="true">
      <rect
        x="4.4"
        y="4.4"
        width="15.2"
        height="15.2"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle
        cx="9"
        cy="9.5"
        r="1.4"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M5 17 9.4 13l3.2 3 2.6-2.4L19 17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TvGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="ref-glyph" aria-hidden="true">
      <rect
        x="3.5"
        y="5"
        width="17"
        height="11"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M9 19h6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StreamingStickGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="ref-glyph" aria-hidden="true">
      <rect
        x="9"
        y="4"
        width="6"
        height="14"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle
        cx="12"
        cy="20"
        r="0.9"
        fill="currentColor"
      />
    </svg>
  );
}

function ConsoleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="ref-glyph" aria-hidden="true">
      <rect
        x="3"
        y="9"
        width="18"
        height="8"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="8" cy="13" r="0.9" fill="currentColor" />
      <circle cx="11" cy="13" r="0.9" fill="currentColor" />
      <circle cx="16" cy="11.5" r="0.9" fill="currentColor" />
      <circle cx="16" cy="14.5" r="0.9" fill="currentColor" />
    </svg>
  );
}

function CheckGlyph() {
  return (
    <svg viewBox="0 0 32 32" className="ref-glyph ref-glyph-large" aria-hidden="true">
      <path
        d="M8 16.5 14 22l10-12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossGlyph() {
  return (
    <svg viewBox="0 0 32 32" className="ref-glyph ref-glyph-large" aria-hidden="true">
      <path
        d="M10 10 22 22M22 10 10 22"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AppleTvGlyph() {
  return (
    <svg viewBox="0 0 32 32" className="ref-glyph ref-glyph-large" aria-hidden="true">
      <rect
        x="5"
        y="7"
        width="22"
        height="14"
        rx="2.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
      />
      <path
        d="M12 25h8"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlayMarkGlyph() {
  return (
    <svg viewBox="0 0 32 32" className="ref-app-mark-glyph" aria-hidden="true">
      <path d="M11 8.5 23 16 11 23.5Z" fill="#fff" />
    </svg>
  );
}

function FireGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="ref-fire-glyph" aria-hidden="true">
      <path
        d="M12 3.5c1.4 2.4 4.6 4.2 4.6 8.4a4.6 4.6 0 0 1-9.2 0c0-2 0.7-3 1.4-4 0 1.6 0.6 2.6 1.6 2.6 0-2.6 0.5-4.4 1.6-7Z"
        fill="#FB923C"
      />
    </svg>
  );
}

function PopcornGlyph() {
  return (
    <svg viewBox="0 0 48 48" className="ref-popcorn-glyph" aria-hidden="true">
      <path
        d="M14 18c0-4 4-7 8-7 2.5-3.5 7.5-3.5 10 0 4 0 8 3 8 7l-3 22a2 2 0 0 1-2 1.7H19a2 2 0 0 1-2-1.7L14 18Z"
        fill="#F5C84B"
      />
      <path
        d="M19 18c0-3 3-5 5-5 1.5-2.5 5-2.5 6.5 0 3 0 5 2 5 5"
        fill="#F87171"
      />
      <path d="M22 24v15M28 24v15M25 21v18" stroke="#fff" strokeWidth="1.4" />
    </svg>
  );
}

function ScreenFrame({
  id,
  children,
  variant,
}: {
  id: DemoId;
  children: React.ReactNode;
  variant?: "center" | "scroll";
}) {
  return (
    <main className="ref-screen" data-demo={id} data-variant={variant ?? "scroll"}>
      <div className="ref-canvas">{children}</div>
    </main>
  );
}

function StepHeader({
  step,
  title,
  sub,
  showDots,
  current,
}: {
  step?: string;
  title: string;
  sub?: string;
  showDots?: boolean;
  current?: number;
}) {
  return (
    <header className="ref-step-header">
      {showDots && <ProgressDots total={3} current={current ?? 0} />}
      {step && <span className="ref-step-tag">{step}</span>}
      <h1>{title}</h1>
      {sub && <p>{sub}</p>}
    </header>
  );
}

function PrimaryCta({ label, fullWidth }: { label: string; fullWidth?: boolean }) {
  return (
    <button
      type="button"
      className={`ref-cta-primary ${fullWidth ? "full" : ""}`}
    >
      {label}
    </button>
  );
}

function GhostCta({ label }: { label: string }) {
  return (
    <button type="button" className="ref-cta-ghost">
      {label}
    </button>
  );
}

function TextLink({ label, dim }: { label: string; dim?: boolean }) {
  return (
    <button type="button" className={`ref-text-link ${dim ? "dim" : ""}`}>
      {label}
    </button>
  );
}

function DeviceCard({
  glyph,
  name,
  description,
  selected,
}: {
  glyph: React.ReactNode;
  name: string;
  description?: string;
  selected?: boolean;
}) {
  return (
    <div className={`ref-device-card ${selected ? "selected" : ""}`}>
      <div className="ref-device-icon" aria-hidden="true">
        {glyph}
      </div>
      <div className="ref-device-copy">
        <strong>{name}</strong>
        {description && <span>{description}</span>}
      </div>
    </div>
  );
}

function DeviceCompactRow({
  glyph,
  name,
  selected,
}: {
  glyph: React.ReactNode;
  name: string;
  selected?: boolean;
}) {
  return (
    <div className={`ref-device-row ${selected ? "selected" : ""}`}>
      <div className="ref-device-row-icon" aria-hidden="true">
        {glyph}
      </div>
      <div className="ref-device-row-copy">
        <strong>{name}</strong>
        <span className="ref-beta-pill">Auto Play beta</span>
      </div>
    </div>
  );
}

function HistoryItem({
  title,
  meta,
  titled,
}: {
  title: string;
  meta: string;
  titled?: boolean;
}) {
  return (
    <div className={`ref-history-item ${titled ? "titled" : ""}`}>
      <div>
        <strong>{title}</strong>
        <span>{meta}</span>
      </div>
      {titled ? (
        <span className="ref-history-check" aria-hidden="true">
          ✓
        </span>
      ) : (
        <button type="button" className="ref-history-add">
          Add title
        </button>
      )}
    </div>
  );
}

/* ───────────────────── Screen 01: Landing ───────────────────── */

function Landing() {
  return (
    <ScreenFrame id="01-landing" variant="center">
      <div className="ref-landing-stack">
        <div className="ref-app-mark">
          <span className="ref-app-mark-glow" aria-hidden="true" />
          <span className="ref-app-mark-tile" aria-hidden="true">
            <PlayMarkGlyph />
          </span>
        </div>
        <h1 className="ref-app-name">3-2-1 Play</h1>
        <p className="ref-app-tagline">Watch Together</p>
        <p className="ref-app-tagline-sub">From Anywhere</p>

        <label className="ref-field">
          <span>Your name</span>
          <input defaultValue="" aria-label="Your name" />
        </label>

        <PrimaryCta label="Create a room" fullWidth />

        <p className="ref-already-invited">
          Already invited? <strong>Enter a code</strong>
        </p>
      </div>
    </ScreenFrame>
  );
}

/* ───────────────────── Screen 02: Step 1 Photo ID ───────────────────── */

function Step1PhotoId() {
  return (
    <ScreenFrame id="02-step1-photo-id">
      <StepHeader
        step="Step 1"
        title="What do you watch on?"
        sub="We'll set up Auto Play for your device."
      />
      <div className="ref-photo-hero">
        <span className="ref-photo-hero-icon" aria-hidden="true">
          <CameraGlyph />
        </span>
        <strong>Identify with a photo</strong>
        <em>
          Snap your TV or remote, or<br />choose from photos.
        </em>
      </div>
      <p className="ref-photo-privacy">
        Photo identifies your device only. Not saved.
      </p>
      <p className="ref-divider-label">or pick manually</p>
      <DeviceCard
        glyph={<TvGlyph />}
        name="TV app built into my TV"
        description="Your TV's built-in streaming apps."
      />
      <DeviceCard
        glyph={<StreamingStickGlyph />}
        name="Streaming stick or box"
        description="Roku, Fire TV, Android TV, etc."
      />
      <DeviceCard
        glyph={<ConsoleGlyph />}
        name="Console / cable / other"
        description="More devices coming soon."
      />
    </ScreenFrame>
  );
}

/* ───────────────────── Screen 03: Photo Bottom Sheet ───────────────────── */

function PhotoBottomSheet() {
  return (
    <ScreenFrame id="03-photo-bottom-sheet" variant="center">
      <div className="ref-sheet-backdrop" aria-hidden="true" />
      <div className="ref-sheet">
        <span className="ref-sheet-handle" aria-hidden="true" />
        <h2 className="ref-sheet-title">Press Play together.</h2>
        <p className="ref-sheet-sub">from anywhere</p>
        <div className="ref-sheet-action">
          <span className="ref-sheet-action-icon" aria-hidden="true">
            <CameraGlyph />
          </span>
          <strong>Take a photo</strong>
        </div>
        <div className="ref-sheet-action">
          <span className="ref-sheet-action-icon" aria-hidden="true">
            <PhotosGlyph />
          </span>
          <strong>Choose from photos</strong>
        </div>
        <button type="button" className="ref-sheet-pick-manually">
          Pick manually instead
        </button>
      </div>
    </ScreenFrame>
  );
}

/* ───────────────────── Screen 04: Manual Step 1 Category ───────────────────── */

function ManualStep1Category() {
  return (
    <ScreenFrame id="04-manual-step1-category">
      <StepHeader
        step="Step 1"
        title="What do you watch on?"
        sub="We'll set up Auto Play for your device."
        showDots
        current={0}
      />
      <DeviceCard
        glyph={<TvGlyph />}
        name="TV app built into my TV"
        description="Your TV's built-in streaming apps."
        selected
      />
      <DeviceCard
        glyph={<StreamingStickGlyph />}
        name="Streaming stick or box"
        description="Roku, Fire TV, Android TV, etc."
      />
      <DeviceCard
        glyph={<ConsoleGlyph />}
        name="Console / cable / other"
        description="More devices coming soon."
      />
      <div className="ref-bottom-cta">
        <PrimaryCta label="Next" fullWidth />
      </div>
    </ScreenFrame>
  );
}

/* ───────────────────── Screen 05: Manual Step 2 Device Picker ───────────────────── */

function ManualStep2DevicePicker() {
  const devices: { name: string; selected?: boolean }[] = [
    { name: "Roku / Roku TV", selected: true },
    { name: "Fire TV / Fire TV Stick" },
    { name: "Google TV / Android TV" },
    { name: "LG TV" },
    { name: "Samsung TV" },
    { name: "VIZIO TV" },
    { name: "Sony TV" },
  ];
  return (
    <ScreenFrame id="05-manual-step2-device-picker">
      <StepHeader
        step="Step 2"
        title="Which device?"
        sub="Tap your device."
        showDots
        current={1}
      />
      <div className="ref-device-list">
        {devices.map((device) => (
          <DeviceCompactRow
            key={device.name}
            glyph={<TvGlyph />}
            name={device.name}
            selected={device.selected}
          />
        ))}
      </div>
      <div className="ref-bottom-cta">
        <PrimaryCta label="Next" fullWidth />
      </div>
    </ScreenFrame>
  );
}

/* ───────────────────── Screen 06: Manual Step 3 Roku Setup ───────────────────── */

function ManualStep3RokuSetup() {
  return (
    <ScreenFrame id="06-manual-step3-roku-setup">
      <StepHeader
        step="Roku Setup"
        title="Connect your Roku"
        sub="One-time setup — about 1 minute."
        showDots
        current={2}
      />
      <div className="ref-numbered-card">
        <span className="ref-numbered-tag">1 of 3</span>
        <strong>Same Wi-Fi?</strong>
        <p>Phone and Roku on the same network.</p>
        <div className="ref-success-pill">
          <span aria-hidden="true">✓</span>
          Same network
        </div>
      </div>
      <div className="ref-numbered-card">
        <span className="ref-numbered-tag">2 of 3</span>
        <strong>Roku IP address</strong>
        <p>
          Settings <span aria-hidden="true">→</span> Network
          <span aria-hidden="true"> → </span>About on your Roku.
        </p>
        <div className="ref-input">
          <input defaultValue="192.168.1." aria-label="Roku IP address" />
        </div>
        <button type="button" className="ref-find-auto">
          Find automatically
        </button>
      </div>
      <div className="ref-bottom-cta">
        <PrimaryCta label="Connect & test" fullWidth />
      </div>
    </ScreenFrame>
  );
}

/* ───────────────────── Screen 07: Result Success ───────────────────── */

function ResultSuccess() {
  return (
    <ScreenFrame id="07-result-success" variant="center">
      <div className="ref-result-stack">
        <div className="ref-status-icon ref-status-success">
          <CheckGlyph />
        </div>
        <h1 className="ref-result-title">You're set.</h1>
        <p className="ref-result-success-sub">Auto Play is ready.</p>
        <p className="ref-result-body">
          Every movie night, we'll press
          <br />
          Play on your Roku for you.
        </p>
        <PrimaryCta label="Done" fullWidth />
      </div>
    </ScreenFrame>
  );
}

/* ───────────────────── Screen 08: Result Failed ───────────────────── */

function ResultFailed() {
  return (
    <ScreenFrame id="08-result-failed" variant="center">
      <div className="ref-result-stack">
        <div className="ref-status-icon ref-status-error">
          <CrossGlyph />
        </div>
        <h1 className="ref-result-title">Didn't work this time.</h1>
        <p className="ref-result-body">
          Connection couldn't reach your Roku.
          <br />
          Check that the IP is correct and both
          <br />
          devices are on the same Wi-Fi.
        </p>
        <PrimaryCta label="Retry" fullWidth />
        <GhostCta label="Try a different device" />
        <p className="ref-result-skip">
          <strong>Start movie night anyway</strong>
          <span>We'll pick this up next session.</span>
        </p>
      </div>
    </ScreenFrame>
  );
}

/* ───────────────────── Screen 09: Apple TV Steer ───────────────────── */

function AppleTvSteer() {
  return (
    <ScreenFrame id="09-apple-tv-steer" variant="center">
      <div className="ref-result-stack">
        <div className="ref-status-icon ref-status-warning">
          <AppleTvGlyph />
        </div>
        <h1 className="ref-result-title">Apple TV detected.</h1>
        <p className="ref-result-body">
          Apple TV doesn't support
          <br />
          Auto Play yet.
        </p>
        <p className="ref-result-body" style={{ marginTop: "8px" }}>
          Do you also have a smart TV?
          <br />
          Auto Play works great with Roku,
          <br />
          LG, Samsung, or VIZIO.
        </p>
        <GhostCta label="Check another device" />
        <TextLink label="Continue without Auto Play" dim />
      </div>
    </ScreenFrame>
  );
}

/* ───────────────────── Screen 10: Countdown Auto Play Ready ───────────────────── */

function CountdownAutoPlay() {
  return (
    <ScreenFrame id="10-countdown-auto-play" variant="center">
      <div className="ref-countdown-stack">
        <p className="ref-countdown-label">Ready in</p>
        <div className="ref-countdown-number">3</div>
        <p className="ref-countdown-sub">Get ready.</p>
        <div className="flow-empty-room" aria-label="Room participants">
          <span>No one has joined yet.</span>
          <small>Share the room code when you're ready.</small>
        </div>
        <GhostCta label="Ready — tap to undo" />
        <p className="ref-countdown-footer">Roku TV · Auto Play ready</p>
      </div>
    </ScreenFrame>
  );
}

/* ───────────────────── Screen 11: Countdown No Auto Play ───────────────────── */

function CountdownNoAutoPlay() {
  return (
    <ScreenFrame id="11-countdown-no-auto-play">
      <div className="ref-countdown-banner">
        <span>Auto Play not set up.</span>
        <button type="button">Set up</button>
      </div>
      <div className="ref-countdown-stack">
        <p className="ref-countdown-label">Ready in</p>
        <div className="ref-countdown-number">3</div>
        <p className="ref-countdown-sub">Press Play on your remote.</p>
        <div className="flow-empty-room" aria-label="Room participants">
          <span>No one has joined yet.</span>
          <small>Share the room code when you're ready.</small>
        </div>
        <GhostCta label="Ready — tap to undo" />
      </div>
    </ScreenFrame>
  );
}

/* ───────────────────── Screen 12: Watch Tracker Free ───────────────────── */

function WatchTrackerFree() {
  return (
    <ScreenFrame id="12-watch-tracker-free">
      <div className="ref-tracker-header">
        <span className="ref-tracker-eyebrow">Watch tracker</span>
        <span className="ref-tracker-badge purple">Year in Sync</span>
      </div>
      <h2 className="ref-tracker-title">
        Your time together,
        <br />
        remembered automatically.
      </h2>
      <p className="ref-tracker-sub">Add a title later for richer recaps.</p>
      <div className="ref-hero-stat">
        <div className="ref-hero-stat-glow" aria-hidden="true" />
        <div className="ref-hero-stat-number">4</div>
        <div className="ref-hero-stat-unit">Watch nights</div>
        <div className="ref-hero-stat-partner">
          with <strong>Partner</strong>
        </div>
      </div>
      <div className="ref-streak">
        <FireGlyph />
        <strong>2 night streak</strong>
        <span>· this week</span>
      </div>
      <div className="ref-stat-pills">
        <div>
          <strong>2</strong>
          <span>Countdowns</span>
        </div>
        <div>
          <strong>Fri</strong>
          <span>Fav night</span>
        </div>
      </div>
      <div className="ref-yis-locked">
        <div className="ref-yis-blur">
          <span className="ref-yis-row">
            <em>YEAR IN SYNC</em>
          </span>
          <span className="ref-yis-row">
            <strong>3 watch nights</strong>
          </span>
          <span className="ref-yis-row">
            <em>Top partner: Partner</em>
          </span>
          <span className="ref-yis-row blur" />
          <span className="ref-yis-row blur" />
        </div>
        <p className="ref-yis-upgrade">Upgrade to Pro for full history</p>
        <button type="button" className="ref-yis-link">
          See what's in Pro
        </button>
      </div>
      <div className="ref-history-list">
        <HistoryItem title="Untitled watch" meta="Partner · 1h 44m · Today" />
        <HistoryItem
          title="Dune: Part Two"
          meta="Partner · 2h 46m · Yesterday"
          titled
        />
        <HistoryItem title="Untitled watch" meta="Partner · 52m · Mon" />
      </div>
    </ScreenFrame>
  );
}

/* ───────────────────── Screen 13: Watch Tracker Pro ───────────────────── */

function WatchTrackerPro() {
  return (
    <ScreenFrame id="13-watch-tracker-pro">
      <div className="ref-tracker-header">
        <span className="ref-tracker-eyebrow">Watch tracker</span>
        <span className="ref-tracker-badge green">Pro</span>
      </div>
      <h2 className="ref-tracker-title">
        Your time together,
        <br />
        remembered automatically.
      </h2>
      <p className="ref-tracker-sub">Add a title later for richer recaps.</p>
      <div className="ref-hero-stat">
        <div className="ref-hero-stat-glow" aria-hidden="true" />
        <div className="ref-hero-stat-number">28</div>
        <div className="ref-hero-stat-unit">Watch nights</div>
        <div className="ref-hero-stat-partner">
          with <strong>Partner</strong>
        </div>
      </div>
      <div className="ref-streak">
        <FireGlyph />
        <strong>6 night streak</strong>
        <span>· personal best!</span>
      </div>
      <div className="ref-stat-pills">
        <div>
          <strong>24</strong>
          <span>Countdowns</span>
        </div>
        <div>
          <strong>Fri</strong>
          <span>Fav night</span>
        </div>
      </div>
      <div className="ref-yis-unlocked">
        <span className="ref-yis-eyebrow">Year in Sync</span>
        <div className="ref-yis-grid">
          <div>
            <strong>28 nights</strong>
            <span>Total</span>
          </div>
          <div>
            <strong>42h 18m</strong>
            <span>Together</span>
          </div>
          <div>
            <strong>6 night streak</strong>
            <span>Best run</span>
          </div>
          <div>
            <strong>Friday</strong>
            <span>Top night</span>
          </div>
          <div>
            <strong>Roku</strong>
            <span>Top device</span>
          </div>
          <div>
            <strong>Sci-fi</strong>
            <span>Top genre</span>
          </div>
        </div>
      </div>
      <div className="ref-history-list">
        <HistoryItem title="The Bear S3E4" meta="Partner · 34m · Today" titled />
        <HistoryItem
          title="Dune: Part Two"
          meta="Partner · 2h 46m · Yesterday"
          titled
        />
        <HistoryItem
          title="Severance S2E8"
          meta="Partner · 48m · Thu"
          titled
        />
      </div>
    </ScreenFrame>
  );
}

/* ───────────────────── Screen 14: Paywall Session 6 ───────────────────── */

function PaywallSession6() {
  return (
    <ScreenFrame id="14-paywall-session-6" variant="center">
      <div className="ref-paywall-stack">
        <h1 className="ref-paywall-title">
          You've watched 5
          <br />
          nights together.
        </h1>
        <p className="ref-paywall-sub">Keep it going.</p>
        <div className="ref-paywall-toggle">
          <span>Monthly</span>
          <span className="active">
            Yearly <em>SAVE 50%</em>
          </span>
        </div>
        <div className="ref-paywall-table">
          <div className="ref-paywall-table-head">
            <span />
            <span>
              <em>FREE</em>
              <strong>$0</strong>
            </span>
            <span className="best">
              <span className="ref-best-chip">BEST VALUE</span>
              <em>PRO</em>
              <strong>$4.99/mo</strong>
            </span>
          </div>
          {[
            ["Watch sessions", "5", "Unlimited"],
            ["Watch Tracker", "Basic", "Full"],
            ["Year in Sync", "—", "✓"],
            ["Shared history", "—", "✓"],
            ["User Insights", "—", "✓"],
          ].map(([feature, free, pro]) => (
            <div className="ref-paywall-table-row" key={feature}>
              <span>{feature}</span>
              <span>{free}</span>
              <span className="pro">{pro}</span>
            </div>
          ))}
        </div>
        <PrimaryCta label="Upgrade to Pro · $4.99/mo" fullWidth />
        <p className="ref-paywall-fine">Cancel anytime</p>
        <p className="ref-paywall-fine fine">
          Terms · Privacy · Restore Purchase
        </p>
        <p className="ref-paywall-not-now">Not now</p>
      </div>
    </ScreenFrame>
  );
}

/* ───────────────────── Screen 15: Post-Session Title Prompt ───────────────────── */

function PostSessionTitlePrompt() {
  return (
    <ScreenFrame id="15-post-session-title-prompt" variant="center">
      <div className="ref-title-stack">
        <PopcornGlyph />
        <h1 className="ref-title-prompt-title">Save this watch night?</h1>
        <p className="ref-title-prompt-sub">
          Add a title for richer stats and recaps.
        </p>
        <label className="ref-field">
          <span>What did you watch?</span>
          <input placeholder="Search titles..." aria-label="Search titles" />
        </label>
        <div className="ref-suggestion-pills">
          <button type="button">Dune: Part Two</button>
          <button type="button">The Bear</button>
          <button type="button">Severance</button>
        </div>
        <PrimaryCta label="Save to history" fullWidth />
        <TextLink label="Skip for now" dim />
      </div>
    </ScreenFrame>
  );
}

/* ───────────────────── Router ───────────────────── */

export function ReferenceScreen({ id }: { id: DemoId }) {
  switch (id) {
    case "01-landing":
      return <Landing />;
    case "02-step1-photo-id":
      return <Step1PhotoId />;
    case "03-photo-bottom-sheet":
      return <PhotoBottomSheet />;
    case "04-manual-step1-category":
      return <ManualStep1Category />;
    case "05-manual-step2-device-picker":
      return <ManualStep2DevicePicker />;
    case "06-manual-step3-roku-setup":
      return <ManualStep3RokuSetup />;
    case "07-result-success":
      return <ResultSuccess />;
    case "08-result-failed":
      return <ResultFailed />;
    case "09-apple-tv-steer":
      return <AppleTvSteer />;
    case "10-countdown-auto-play":
      return <CountdownAutoPlay />;
    case "11-countdown-no-auto-play":
      return <CountdownNoAutoPlay />;
    case "12-watch-tracker-free":
      return <WatchTrackerFree />;
    case "13-watch-tracker-pro":
      return <WatchTrackerPro />;
    case "14-paywall-session-6":
      return <PaywallSession6 />;
    case "15-post-session-title-prompt":
      return <PostSessionTitlePrompt />;
  }
}
