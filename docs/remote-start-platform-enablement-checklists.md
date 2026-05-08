# Remote Start platform enablement checklists

All defaults are off unless stated. Real-device evidence is required later before enablement.

## Roku
- Flag: `rokuRuntimeBetaEnabled`
- Default: off; internal beta may set true with public off.
- Command path: local Play helper command.
- Copy: user opens and pauses title; Test Play requires Yes confirmation before ready.
- Pairing/approval: same home Wi‑Fi and mobile control available.
- Mock/synthetic tests: simulator covers Roku TV and Roku streaming.
- Outcome events: setup, Test Play, ready confirmation, GO, fallback, failures.
- Kill switch: hides all Remote Start.
- Support copy: see support runbook.
- Real-device evidence required later.
- Reason not public now: behavior remains unverified beyond internal beta.

## VIZIO
- Flag: `vizioRuntimeBetaEnabled`
- Default: off; QA-only URL proof can expose locally.
- Command path: SmartCast Play helper path.
- Pairing/approval: TV approval/token expected later.
- Tests/events/kill switch/support copy: synthetic only now.
- Real-device evidence required later.
- Reason disabled now: no accepted real-device evidence.

## LG
- Flag: `lgRuntimeBetaEnabled`
- Default: off; QA-only local proof only.
- Command path: webOS media controls Play.
- Pairing/approval: TV approval/client key expected later.
- Tests/events/kill switch/support copy: synthetic only now.
- Real-device evidence required later.
- Reason disabled now: no accepted real-device evidence.

## Sony
- Flag: `sonyRuntimeBetaEnabled`
- Default: off; QA-only local proof only.
- Command path: Bravia Play helper path.
- Pairing/approval: local approval/secret expected later.
- Tests/events/kill switch/support copy: synthetic only now.
- Real-device evidence required later.
- Reason disabled now: no accepted real-device evidence.

## Samsung
- Flag: `samsungRuntimeBetaEnabled`
- Default: off; QA-only local proof only.
- Command path: Tizen Play key helper path.
- Pairing/approval: TV approval/token expected later.
- Tests/events/kill switch/support copy: synthetic only now.
- Real-device evidence required later.
- Reason disabled now: no accepted real-device evidence.
