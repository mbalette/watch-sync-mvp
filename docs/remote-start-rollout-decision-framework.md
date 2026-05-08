# Remote Start rollout decision framework

These thresholds are provisional and do not automatically enable any flag.

## Before broader Roku beta
- At least 30 successful Test Play attempts across at least 5 Roku models.
- At least 80% Test Play pass rate on paused-content states.
- At least 80% GO success self-report after user confirmation.
- Manual fallback rate below 20%.
- Wrong screen/overlay below 15%, excluding intentionally invalid states.
- Redaction audit shows no privacy leaks in client events, API sanitizer, KV-stored events, exports, and summaries.
- Kill switch verified within the last 7 days.

## Required decision notes
- Keep public off until an explicit human rollout decision is recorded.
- Keep VIZIO, LG, Samsung, and Sony flags off until platform-specific real-device evidence exists later.
- Treat simulator and mock results as non-hardware readiness only.
