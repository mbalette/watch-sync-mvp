# 321Play Raw String Literal Dump

Source files:
- `src/App.tsx`
- `src/tv-remote-device.ts`
- `src/recommendations.ts`
- `src/domain.ts`

Note: this is a broad regex dump of quoted/template strings; it includes developer keys/API paths as well as user-facing copy, so use the curated inventory for clean app text.

## src/App.tsx
1. `react`
2. `./App.css`
3. `./domain`
4. `./transport`
5. `./tv-remote-device`
6. `./remote-start-runtime-config`
7. `./remote-start-outcome-log`
8. `./recommendations`
9. `watch-sync.localParticipant`
10. `watch-sync.currentRoom`
11. `watch-sync.recommendationProviders`
12. `watch-sync.recommendationRegion`
13. `watch-sync.room.${roomId}`
14. `ws://127.0.0.1:8787`
15. `platform`
16. `lg_webos`
17. `samsung`
18. `sony_bravia`
19. `built_in_tv_app`
20. `apple_tv_manual`
21. `streaming_stick_or_box`
22. `roku`
23. `android_adb`
24. `game_console_or_other`
25. `string`
26. `US`
27. `▶`
28. `recommendation-poster ${item.posterUrl ? "" : "fallback"}`
29. `true`
30. `lazy`
31. `host`
32. `guest`
33. `room`
34. `00:00`
35. `all`
36. `movie`
37. `tv`
38. `popular`
39. `new`
40. `recent`
41. `Showing a safe mock catalog. Live TMDB search is optional once a server token is configured.`
42. `mock`
43. `tmdb`
44. `No linked TV yet. Start with how you watch, pick your device, then follow the setup steps.`
45. `3`
46. `idle`
47. `${window.location.origin}${window.location.pathname}?room=${room.roomId}`
48. `ready`
49. `chat_message`
50. `recommendation_sent`
51. `recommendation_selected`
52. `Laptop auto-sync available`
53. `TV/manual mode`
54. `primary-beta`
55. `guided-setup-beta`
56. `home_assistant_webhook`
57. `Streaming boxes stay on manual countdown tonight.`
58. `TV apps stay on manual countdown tonight.`
59. `Manual countdown works tonight. Remote Start setup is not available for this session.`
60. `Roku / Roku TV`
61. `Remote Start beta / primary`
62. `Local ECP Play at GO; some Roku OS builds require Control by mobile apps/network access.`
63. `LG webOS`
64. `Pair on TV prompt, save client key locally, then Test Play/Pause. Hardware validation pending.`
65. `Samsung Tizen`
66. `Remote Start beta`
67. `TV approval/token if required, Test Play/Pause. Model/firmware variance expected.`
68. `Sony Bravia`
69. `Remote Start beta for supported Sony TVs`
70. `Enable IP Control/PSK or PIN if needed, discover Play IRCC code, then Test Play.`
71. `Fire TV / Android TV / Google TV`
72. `Guided setup beta`
73. `Developer Options/debugging, IP or pairing code, approve prompt, Test Play, Save. Some devices may need reconnect.`
74. `Apple TV`
75. `Manual-only`
76. `No public direct-control headline claim; reverse-engineered pairing stays internal/beta only if accepted.`
77. `Xbox / Cable / ISP boxes / Cast-AirPlay`
78. `Manual countdown remains the truthful public path unless a safe account/session-specific beta is separately accepted.`
79. `/api/remote-start-runtime-config`
80. `no-store`
81. `Creating room...`
82. `Joining room...`
83. `?room=${nextRoom.roomId}`
84. `error`
85. `storage`
86. `connected`
87. `Enter the TV remote helper URL first.`
88. `Helper URL must be localhost, a private LAN address, or a .local host before Watch Sync sends local pairing details.`
89. `${baseUrl}${path}`
90. `TV remote helper returned ${response.status}`
91. `GET`
92. `POST`
93. `Content-Type`
94. `application/json`
95. `Home Assistant advanced bridge saved locally. Watch Sync servers do not store HA credentials, entity IDs, or webhook URLs.`
96. `Apple TV saved as manual-only. Watch Sync will not send direct Apple TV commands; manual countdown remains the path.`
97. `${next.label} saved locally for Remote Start. Room backend still only coordinates countdown; this helper controls your local device on your LAN.`
98. `Testing ${savedDevice.label} via local helper...`
99. `roku_test_play_attempt`
100. `unknown`
101. `test_play_pass`
102. `pass`
103. `${savedDevice.label} Test Play sent. Confirm that the video started, then pause it again before enabling GO Play.`
104. `test_play_fail`
105. `fail`
106. `helper_failed`
107. `${savedDevice.label} helper check failed.`
108. `ready_confirmed`
109. `${ready.label} is ready for 3·2·1 Play. Keep the video paused; Watch Sync will send one Play command at PLAY.`
110. `manual_play_fallback`
111. `Use manual countdown tonight. No Remote Start command will be sent at PLAY.`
112. `manual`
113. `countdown`
114. `Remote Start at GO is off or this platform has no safe GO Play command. Manual countdown remains the fallback.`
115. `Add a Home Assistant webhook URL before sending GO. Manual countdown still works.`
116. `Link a supported TV/device before sending Play. Manual countdown still works.`
117. `Sending one Home Assistant webhook GO via local helper...`
118. `Sending one ${savedDevice.label} Play command via local helper...`
119. `go_attempted`
120. `go_sent`
121. `sent`
122. `Home Assistant webhook GO sent (${source}). Compatibility depends on your HA automation/integration/device/app; use manual fallback if it does not play.`
123. `${savedDevice.label} Play sent (${source}). This is a generic remote command only; use manual fallback if the TV app ignores it.`
124. `go_failed`
125. `failed`
126. `${savedDevice.label} Play failed. Use manual countdown.`
127. `Sending one ${savedDevice.label} Pause command via local helper...`
128. `${savedDevice.label} Pause sent. This is a generic remote command only; if the app ignores it, pause manually at the sync point.`
129. `${savedDevice.label} Pause failed. Pause manually at the sync point.`
130. `vibrate`
131. `${room.roomId}:${room.updatedAt}:${Object.entries(       room.readyState,     )       .sort(([a], [b]) => a.localeCompare(b))       .map(([id, status]) =>`
132. `)       .join("\|")}`
133. `countdown_started`
134. `counting`
135. `PLAY`
136. `${room.roomId}:${room.countdownState.startedAt ?? room.countdownState.startsAtEpochMs ?? ""}`
137. `play_now`
138. `countdown_cancelled`
139. `?room=${newRoom.roomId}`
140. `Room not found. Check the code or ask your partner for a fresh invite link.`
141. `participant_joined`
142. `?room=${joined.roomId}`
143. `setup_updated`
144. `Link copied!`
145. `Copy this link: ${inviteLink}`
146. `resync_requested`
147. `participant_ready`
148. `Pairing details copied!`
149. `Pairing details: ${details}`
150. `Services saved locally on this device.`
151. `Browsing TMDB provider catalog via the server token proxy...`
152. `${payload.error ??`
153. `} Showing mock catalog instead.`
154. `Showing provider-filtered TMDB browse results. Availability can vary by region, account plan, and date.`
155. `TMDB returned no provider-filtered titles for those filters. Try a different service or tab, or use mock cards.`
156. `${error.message}. Showing mock catalog instead.`
157. `TMDB provider browsing failed. Showing mock catalog instead.`
158. `Type a title or keyword before live TMDB search. Mock recommendations are still available.`
159. `Searching TMDB via the server token proxy...`
160. `Showing live TMDB results for the selected region/providers. Provider availability can vary by account and date.`
161. `TMDB returned no matching titles for those filters. Showing an empty live result set; clear live search to return to mock cards.`
162. `TMDB search failed. Showing mock catalog instead.`
163. `Showing the safe mock catalog. Live TMDB search can be retried any time.`
164. `step1`
165. `step2`
166. `step3`
167. `start`
168. `smooth`
169. `Provider filters cleared and local service preferences removed. Browse TMDB or search again across all services.`
170. `Provider filters cleared. Browsing TMDB across all services...`
171. `} Provider filters are cleared; showing mock catalog instead.`
172. `Showing TMDB browse results across all services. Availability can vary by region, account plan, and date.`
173. `TMDB returned no titles across all services for this tab. Try another tab/search or use mock cards.`
174. `${error.message}. Provider filters are cleared; showing mock catalog instead.`
175. `TMDB browse failed after clearing filters. Showing mock catalog instead.`
176. `Provider filters cleared. Searching TMDB across all services...`
177. `Showing live TMDB results across all services. Provider availability can vary by region, account, and date.`
178. `TMDB returned no matching titles across all services. Try another search or use mock cards.`
179. `TMDB search failed after clearing filters. Showing mock catalog instead.`
180. `${item.title} is already in Tonight's queue.`
181. `Added ${item.title} to Tonight's queue.`
182. `up`
183. `down`
184. `recommendation_voted`
185. `${vote === "up" ? "Voted yes" : "Voted no"} on ${item.title}.`
186. `${item.title} set as tonight's watch. Everyone should pause at 00:00 and ready up.`
187. `Get ready to press play!`
188. `play`
189. `Press play now!`
190. `Waiting for your partner to join...`
191. `Invite your partner, then tap ready.`
192. `Waiting for your partner...`
193. `Both pause at this time, then tap ready.`
194. `active`
195. `Series`
196. `Movie`
197. `,`
198. `Any service`
199. `·`
200. `Added by Partner`
201. `Partner`
202. `First added by ${firstName}; latest by ${latestName}`
203. `Added by ${firstName}`
204. `app-shell landing`
205. `app-title`
206. `welcome-screen`
207. `welcome-orb`
208. `welcome-header`
209. `eyebrow`
210. `tagline`
211. `truth-card`
212. `How Watch Sync works`
213. `welcome-form`
214. `field-label`
215. `Alex`
216. `Your name`
217. `name`
218. `AB12CD`
219. `Room code`
220. `uppercase`
221. `0.15em`
222. `primary`
223. `submit`
224. `join-toggle`
225. `button`
226. `status-toast`
227. `status`
228. `app-shell`
229. `room-title`
230. `room-header`
231. `brand-lockup`
232. `brand-mark`
233. `brand-name`
234. `mode-label`
235. `room-pill`
236. `Copy invite link`
237. `room-strip`
238. `Room status`
239. `connection-dot ${transportStatus === "connected" ? "" : "offline"}`
240. `Live room connected`
241. `Private local room`
242. `strip-divider`
243. `early-remote-onboarding`
244. `Remote Start quick setup`
245. `onboarding-heading early-remote-heading`
246. `wizard-kicker`
247. `setup-sequence early-setup-sequence`
248. `Remote Start setup steps`
249. `early-method-row`
250. `What are you using to watch choices`
251. `early-method-choice ${active ? "active" : ""}`
252. `setup_start`
253. `Console / cable / not sure`
254. `early-no-device`
255. `Next: pick the remote you’d normally press Play with.`
256. `No TV or streaming device is selected yet — choose a watch method first.`
257. `early-remote-open`
258. `Continue to device setup`
259. `Start guided setup`
260. `countdown-hero`
261. `polite`
262. `Countdown`
263. `hero-copy`
264. `countdown-label`
265. `Both pause at`
266. `Ready in`
267. `Press play`
268. `countdown-number ${getCountdownClass()}`
269. `countdown-hint`
270. `partner-status`
271. `Partner ready status`
272. `partner-chip ${room.readyState[person.id] === "ready" ? "ready" : ""} ${person.id === currentParticipantId ? "you" : ""}`
273. `status-dot`
274. `(you)`
275. `partner-chip ghost`
276. `ready-button ${isReady ? "is-ready" : ""}`
277. `Ready — tap to undo`
278. `I'm ready`
279. `solo-preview`
280. `setup-sheet`
281. `Room setup`
282. `setup-section invite-card`
283. `copy-button`
284. `setup-section time-card`
285. `time-input-row`
286. `numeric`
287. `Pause time`
288. `alert-banner`
289. `control-stack`
290. `Room controls`
291. `quick-actions`
292. `secondary-action`
293. `secondary-action remote-start-shortcut`
294. `Continue device setup`
295. `Pick watch method first`
296. `chat-panel`
297. `chat-messages`
298. `chat-empty`
299. `chat-bubble ${messageEvent.actorId === currentParticipantId ? "sent" : "received"}`
300. `${messageEvent.at}-${messageEvent.actorId}`
301. `sender`
302. `chat-input-row`
303. `Message...`
304. `Chat message`
305. `Send`
306. `tonight-card`
307. `Tonight's selected watch`
308. `(${selectedWatchEvent.item.year})`
309. `recommendation-feed queue-section`
310. `Tonight's queue`
311. `queue-header`
312. `s queue</h2>             </div>             <span>{recommendationQueue.length} queued</span>           </div>           {recommendationQueue.length === 0 ? (             <p className="queue-empty">               Search by your services, add a few picks, then let the room vote               on what to watch tonight.             </p>           ) : (             recommendationQueue.map((queueItem) => {               const votes = getRecommendationVoteSummary(queueItem.key);               return (                 <article                   className={`recommendation-card queue-card ${queueItem.selected ? "selected" : ""}`}                   key={queueItem.key}                 >                   <div className="recommendation-card-body">                     <RecommendationPoster item={queueItem.item} />                     <div className="recommendation-copy">                       <div>                         <strong>                           {queueItem.item.title}                           {queueItem.item.year                             ? ` (${queueItem.item.year})`                             : ""}                         </strong>                         <span>{recommendationSubtitle(queueItem.item)}</span>                         <span>                           {queueRecommenderLabel(queueItem)} ·{" "}                           {queueItem.recommendCount} add                           {queueItem.recommendCount === 1 ? "" : "s"}                         </span>                       </div>                       <p>{queueItem.item.overview}</p>                       <div className="recommendation-meta">                         <span>                           {queueItem.item.ratingLabel &&                           queueItem.item.ratingValue                             ? `${queueItem.item.ratingLabel}: ${queueItem.item.ratingValue}`                             : "Rating unavailable"}                         </span>                         {queueItem.item.externalUrl && (                           <a                             href={queueItem.item.externalUrl}                             target="_blank"                             rel="noreferrer"                           >                             Details                           </a>                         )}                       </div>                       {queueItem.selected && (                         <span className="selected-badge">Set for tonight</span>                       )}                     </div>                   </div>                   <div                     className="vote-row"                     aria-label={`Votes for ${queueItem.item.title}`}                   >                     <button                       className={votes.current === "up" ? "current-vote" : ""}                       type="button"                       onClick={() => voteRecommendation(queueItem.key, "up")}                       aria-pressed={votes.current === "up"}                     >                       👍 {votes.up}                     </button>                     <button                       className={votes.current === "down" ? "current-vote" : ""}                       type="button"                       onClick={() => voteRecommendation(queueItem.key, "down")}                       aria-pressed={votes.current === "down"}                     >                       👎 {votes.down}                     </button>                     <button                       type="button"                       onClick={() => selectRecommendation(queueItem.key)}                     >                       {queueItem.selected ? "Selected" : "Set tonight"}                     </button>                   </div>                   <p className="set-tonight-helper">                     Sets the room`
313. `recommend-drawer`
314. `drawer-toggle ${showRecommendDrawer ? "open" : ""}`
315. `Live TMDB browse/search`
316. `Pick services + browse`
317. `drawer-content recommend-panel`
318. `recommendation-tabs`
319. `Browse category`
320. `Popular`
321. `New-ish`
322. `Recently aired`
323. `selected`
324. `field-label compact`
325. `Recommendation media type`
326. `Recommendation country or region`
327. `CA`
328. `GB`
329. `AU`
330. `DE`
331. `FR`
332. `JP`
333. `Try The Bear, Dune, comedy...`
334. `Search watch recommendations`
335. `remote-button-row triple recommendation-actions`
336. `source-pill ${recommendationSource}`
337. `Live`
338. `Mock`
339. `mode-caveat`
340. `active-filter-row`
341. `Active recommendation filters`
342. `All services`
343. `Movies + shows`
344. `Movies only`
345. `Shows only`
346. `provider-filter-row`
347. `Streaming service filters`
348. `recommendation-results`
349. `recommendation-empty-state`
350. `active-filter-row compact`
351. `No-match recovery actions`
352. `recommendation-card ${queued ? "queued" : ""}`
353. `recommendation-card-body`
354. `recommendation-copy`
355. `(${item.year})`
356. `recommendation-meta`
357. `${item.ratingLabel}: ${item.ratingValue}`
358. `Rating unavailable`
359. `In queue`
360. `Add to queue`
361. `tv-remote-drawer`
362. `drawer-toggle ${showTvRemoteDrawer ? "open" : ""}`
363. `drawer-content tv-remote-panel`
364. `manual-only`
365. `1`
366. `remote-onboarding-flow`
367. `Remote Start onboarding`
368. `onboarding-heading`
369. `tv-choice-grid method-choice-grid`
370. `tv-choice-card method-choice-card ${active ? "active" : ""}`
371. `tv-choice-icon`
372. `tv-choice-copy`
373. `selected-tv-hint`
374. `2`
375. `remote-onboarding-flow ${remoteWatchingMethod ? "" : "disabled-step"}`
376. `Choose your TV or streaming device for Remote Start`
377. `Which device is it?`
378. `Pick how you watch first`
379. `Tap the closest match. Nothing connects until you choose one and save/test it.`
380. `This step unlocks after Step 1 so the app does not default to any device.`
381. `tv-choice-grid`
382. `tv-choice-card ${active ? "active" : ""}`
383. `tv-choice-badge ${choice.recommended ? "recommended" : "manual"}`
384. `empty-next-step`
385. `remote-setup-wizard`
386. `${remoteStartWizard.title} wizard`
387. `wizard-heading-row`
388. `wizard-status ${remoteStartWizard.label === "Manual-only" ? "manual" : remoteStartWizard.label === "Guided setup beta" ? "guided" : remoteStartWizard.label === "Not supported yet" ? "unsupported" : "beta"}`
389. `wizard-steps`
390. `details-toggle`
391. `Hide setup details`
392. `Show setup details`
393. `wizard-facts`
394. `wizard-action-row`
395. `remote-setup-wizard empty-wizard`
396. `Remote Start setup locked until device selection`
397. `Linked TV`
398. `TV remote platform`
399. `${option.label} — ${option.status}`
400. `platform-picker-note`
401. `· ${selectedTvPlatformOption.helperLabel}`
402. `http://homeassistant.local:8123/api/webhook/REPLACE_WITH_RANDOM_ID`
403. `password`
404. `off`
405. `url`
406. `Home Assistant webhook URL`
407. `ADB device host[:port]`
408. `TV IP / hostname`
409. `192.168.1.50:5555`
410. `192.168.1.42`
411. `TV IP address or hostname`
412. `http://127.0.0.1:8790`
413. `TV remote helper URL`
414. `Optional: ws://tv:3000 or http://tv:1925`
415. `Protocol URL override`
416. `LG client key`
417. `Samsung token`
418. `Vizio auth token`
419. `Stored locally only`
420. `Local pairing token`
421. `Optional local PSK`
422. `Sony PSK`
423. `From remote-controller-info`
424. `Sony Play IRCC code`
425. `philips_jointspace`
426. `Philips JointSpace API version`
427. `wizard-action-row setup-next-line`
428. `Remote Start setup sequence`
429. `Enter the device details above, then save setup.`
430. `Save setup, test Play, then enable GO Play only if the test works.`
431. `remote-button-row triple primary-setup-actions`
432. `Save setup after details`
433. `Save setup`
434. `Test Play after details`
435. `Confirm Test Play result`
436. `remote-button-row triple advanced-test-actions`
437. `Optional Remote Start test commands`
438. `field-label compact checkbox-row enable-go-row`
439. `checkbox`
440. `Use Remote Start at GO`
441. `enabled — a single safe Play command can be sent at GO.`
442. `off or unavailable for unsupported/later/manual lanes — manual countdown remains active.`
443. `test the connection first, then enable GO Play if this lane supports it.`
444. `yes`
445. `not yet`
446. `extension-status`
447. `compatibility-mini`
448. `TV Remote Mode compatibility`
449. `laptop-drawer`
450. `drawer-toggle ${showLaptopDrawer ? "open" : ""}`
451. `drawer-content`
452. `pairing-info`
453. `pairing-row`
454. `Join/create first`
455. `Playback: ${localPlayback.paused ? "paused" : "playing"} at ${localPlayback.currentTime.toFixed(1)}s`
456. `Extension paired: ${pairedExtensions.map((ext) => ext.tabTitle \|\| ext.extensionId).join(", ")}`
457. `Extension status: not paired yet.`
458. `status-toast floating`

## src/tv-remote-device.ts
1. `./remote-start-runtime-config`
2. `roku`
3. `lg_webos`
4. `samsung`
5. `android_adb`
6. `sony_bravia`
7. `philips_jointspace`
8. `vizio_smartcast`
9. `home_assistant_webhook`
10. `apple_tv_manual`
11. `primary-beta`
12. `guided-setup-beta`
13. `reverse-engineered-beta`
14. `account-pairing-beta`
15. `later-beta`
16. `manual-only`
17. `not-supported-yet`
18. `Remote Start beta / primary`
19. `Remote Start beta`
20. `Remote Start beta for supported Sony TVs`
21. `Guided setup beta`
22. `Reverse-engineered beta`
23. `Account-pairing beta`
24. `Later beta`
25. `Manual-only`
26. `Not supported yet`
27. `not_configured`
28. `needs_setup`
29. `ready`
30. `reconnect_needed`
31. `test_failed`
32. `manual_tonight`
33. `unsupported`
34. `unverified_hardware_behavior`
35. `Remote Start ready`
36. `Reconnect needed`
37. `Needs setup`
38. `Manual countdown tonight`
39. `Device behavior not verified yet`
40. `GET`
41. `POST`
42. `built_in_tv_app`
43. `streaming_stick_or_box`
44. `game_console_or_other`
45. `watch-sync.linkedTvDevice.v1`
46. `Play`
47. `ssap://media.controls/play`
48. `KEY_PLAY`
49. `KEYCODE_MEDIA_PLAY`
50. `IRCC Play code`
51. `TV app built into my TV`
52. `TV`
53. `Netflix, Hulu, Disney+, Prime, Max, or YouTube opened from the TV home screen.`
54. `Next, pick your TV brand so Watch Sync can show the right setup steps.`
55. `Streaming stick or box`
56. `▭`
57. `Roku, Fire TV, Android TV, and Google TV paths can be set up and tested when available.`
58. `Next, pick the remote you’d normally press Play with — Roku, Fire TV, Android TV, Google TV, or manual fallback.`
59. `Game console / cable box / not sure`
60. `?`
61. `Consoles, cable boxes, casting sessions, or anything not listed stay on manual countdown.`
62. `Manual countdown works tonight. Remote Start only appears when a safe local Play path exists.`
63. `Roku / Roku TV`
64. `▣`
65. `Start here for Roku devices: enter the Roku IP, save, then Test Play.`
66. `Pick Roku if your TV or streaming stick says Roku.`
67. `Fire TV / Android TV / Google TV`
68. `F`
69. `Connect over local debugging/pairing, approve the TV prompt, then Test Play.`
70. `Pick this for Fire TV, Firestick, Android TV, Google TV, Chromecast with Google TV, or Google TV Streamer.`
71. `VIZIO TV`
72. `V`
73. `Pair with the TV code, save the auth token locally, then Test Play.`
74. `Pick this for VIZIO TVs using the built-in TV streaming app.`
75. `LG TV`
76. `LG`
77. `Pair on the TV prompt, save the local client key, then Test Play.`
78. `Pick this for LG webOS smart TVs.`
79. `Samsung TV`
80. `S`
81. `Approve the TV prompt/token if shown, then Test Play.`
82. `Pick this for Samsung/Tizen smart TVs.`
83. `Sony Bravia TV`
84. `B`
85. `Enable IP Control on supported Bravia models, then discover/test Play.`
86. `Pick this for Sony Bravia TVs with IP Control.`
87. `Other / console / cable box`
88. `No direct Remote Start path yet. Use manual countdown tonight.`
89. `If your device is not listed, use manual countdown. It is available with any TV.`
90. `LG webOS`
91. `Samsung / Tizen`
92. `Sony / Bravia`
93. `Philips JointSpace`
94. `Home Assistant local bridge`
95. `Apple TV`
96. `Roku / Roku TV setup`
97. `First internal Remote Start lane: local Roku ECP Play at GO after the user opens and pauses the title.`
98. `Keep this device and your Watch Sync helper on the same Wi-Fi/LAN.`
99. `If keypresses fail, enable Roku Control by mobile apps / Network access in TV settings.`
100. `Enter the Roku IP or hostname, save locally, then Test Play before movie night.`
101. `May require Control by mobile apps / Network access on newer Roku OS builds.`
102. `No token pairing. Reliability depends on LAN access, device reachability, and IP/discovery.`
103. `Play only`
104. `Pause is not exposed as a safe automatic command. Pause manually at 00:00.`
105. `No Play/Pause toggle at GO and no blind retries.`
106. `Check Roku`
107. `Roku Remote Start beta sends one local Play command at GO. Manual countdown remains available as fallback.`
108. `LG webOS setup`
109. `Pair with the TV prompt, save the LG client key locally, then test discrete Play/Pause.`
110. `Enter the LG TV IP or hostname and keep the helper on the same LAN.`
111. `Run Pair/Test and accept the pairing prompt on the TV.`
112. `Save the client key locally, then Test Play/Pause before movie night.`
113. `LG Connect Apps / TV prompt pairing may be required.`
114. `Client key is expected to persist but must be hardware-validated after sleep/reboot/helper restart.`
115. `SSAP media.controls/play only`
116. `Discrete Pause exists for test/setup; GO still sends Play only.`
117. `No Play/Pause toggle at GO.`
118. `Pair TV`
119. `LG webOS Remote Start beta uses local TV pairing. Hardware behavior is not verified yet.`
120. `Samsung Tizen setup`
121. `Beta local-key path after Samsung TV approval/token when required; model variance expected.`
122. `Enter the Samsung TV IP or hostname and optional protocol URL/token if already known.`
123. `Run Pair/Test and approve the TV prompt if shown.`
124. `Save the token locally, then Test Play/Pause on a paused video.`
125. `TV approval prompt/token may be required; ports and behavior vary by model/firmware.`
126. `Token persistence is model-dependent and hardware-unverified.`
127. `KEY_PLAY only`
128. `KEY_PAUSE is available for testing where it behaves discretely.`
129. `Do not use KEY_PLAYPAUSE at GO.`
130. `Samsung Remote Start beta is for supported TVs after local approval; not official universal support.`
131. `Fire / Android / Google TV guided setup`
132. `Guided ADB beta for Fire OS, Android TV, Google TV, Nvidia Shield, Onn, Chromecast with Google TV, and Google TV Streamer. Fire TV Vega is not supported yet.`
133. `Open Developer Options / debugging on the TV or streamer.`
134. `Enter the device IP/port or wireless debugging pairing code flow, then approve the prompt.`
135. `Run Connect ADB + Test Play. Some devices may need reconnect before movie night.`
136. `Developer Options, ADB/wireless debugging, and an approval prompt are required.`
137. `May persist with stable ADB keys, but sleep/reboot/network changes remain hardware-unverified.`
138. `KEYCODE_MEDIA_PLAY only`
139. `KEYCODE_MEDIA_PAUSE is available for setup/testing; GO uses Play only.`
140. `KEYCODE_MEDIA_PLAY_PAUSE / 85 is blocked for GO.`
141. `Connect ADB`
142. `Guided setup beta. Some devices may need reconnect. Manual countdown remains available as fallback.`
143. `Sony Bravia setup`
144. `Supported Bravia/IP Control models can use local IRCC Play after IP Control and Play-code discovery.`
145. `Enable IP Control on the supported Sony Bravia TV and configure PSK/PIN if needed.`
146. `Enter the TV IP/hostname and run remote-controller-info to discover the Play IRCC code.`
147. `Save the Play IRCC code locally, then Test Play before movie night.`
148. `IP Control must be enabled and supported by the model; PSK/PIN may be required.`
149. `Expected to persist while IP Control/PSK remain stable, but hardware validation is required.`
150. `Discovered Play IRCC code only`
151. `Pause is not exposed as safe in the current panel.`
152. `No toggle command at GO.`
153. `Discover Play code`
154. `Remote Start beta for supported Sony TVs only. Do not imply all Sony Google TVs work.`
155. `Philips JointSpace later beta`
156. `Later/experimental only because common paths expose PlayPause toggle risk.`
157. `Use manual countdown tonight.`
158. `Only revisit this adapter after primary lanes are validated.`
159. `Do not enable automatic GO unless a discrete Play path is proven.`
160. `Model/API-generation settings vary.`
161. `Unknown.`
162. `None for automatic GO`
163. `Toggle-risk pause/play is not safe for automatic setup.`
164. `PlayPause toggle is not allowed for GO.`
165. `Use manual countdown`
166. `Later beta only; manual countdown remains the public path.`
167. `VIZIO Remote Start Beta`
168. `Watch Sync will pair with your VIZIO TV and test one Play command. Remote Start is only enabled if the test starts your paused video.`
169. `Open the streaming app directly on your VIZIO TV; do not use phone/tablet/computer casting for this beta.`
170. `Enter the TV IP, start pairing, then enter the newest code shown on the TV.`
171. `Test Play sends one Play command; use Manual Play tonight if it does not start the paused video.`
172. `Your VIZIO TV will show a code during pairing.`
173. `Auth token is stored locally after pairing and must be hardware-validated by model.`
174. `VIZIO key_command Play only`
175. `Pause is not part of GO. Keep the video paused manually after Test Play confirmation.`
176. `No app launch, title launch, Cast takeover, or Play/Pause toggle at GO.`
177. `Pair with TV code`
178. `VIZIO Remote Start Beta tests one local Play command only after direct-TV-app setup.`
179. `Home Assistant bridge`
180. `Not a D2C default. Only use if a user already has local Home Assistant automation.`
181. `Use manual countdown unless you already run HA locally.`
182. `Keep webhook URLs local/private.`
183. `Do not present HA/Broadlink/CEC as default consumer setup.`
184. `External bridge setup outside Watch Sync.`
185. `Depends on the user bridge.`
186. `User-owned automation only`
187. `Depends on bridge; not public support.`
188. `User automation must avoid toggle-risk GO.`
189. `Not a default consumer path.`
190. `Manual-only by default. No public App-Store-safe direct-control path is proven.`
191. `Open the title on Apple TV yourself.`
192. `Pause at 00:00.`
193. `Use the Watch Sync countdown and press Play manually at GO.`
194. `None for Watch Sync public control.`
195. `No public Watch Sync pairing. Reverse-engineered pairing is not headline support.`
196. `None`
197. `Manual pause only.`
198. `No private Apple APIs and no reverse-engineered public headline claim.`
199. `Apple TV stays manual-only unless an explicit internal beta is accepted later.`
200. `Linked TV`
201. `http://127.0.0.1:8790`
202. `number`
203. `Remote Start beta is paused or not enabled for this audience; manual countdown remains available.`
204. `This platform is not currently a D2C Remote Start target.`
205. `This platform stays manual-only unless a safe public control path is proven.`
206. `Add the local device/helper details before enabling Remote Start.`
207. `LG webOS needs TV prompt pairing and a saved client key.`
208. `Sony Bravia needs IP Control enabled and a discovered Play IRCC code.`
209. `Run Pair/Test before movie night so the helper can confirm the device is reachable.`
210. `Mock/helper checks passed, but real TV/app behavior is still hardware-unverified.`
211. `Hardware validation and the local helper check are both current.`
212. `http:`
213. `https:`
214. `localhost`
215. `127.0.0.1`
216. `::1`
217. `.local`
218. `Remote Start beta is paused or unavailable for this device. Use manual countdown tonight.`
219. `${device.label} is manual-only. Use the manual countdown fallback.`
220. `Apple TV is manual-only. Watch Sync does not claim direct Apple TV remote control.`
221. `/roku/keypress`
222. `LG TV needs a paired client key before Test Play can send one Play command.`
223. `/lg/keypress`
224. `play`
225. `/samsung/keypress`
226. `/adb/connect`
227. `Sony TV needs a discovered Play IRCC code before Test Play can send one Play command.`
228. `/sony/keypress`
229. `/philips/key`
230. `Pause`
231. `/vizio/keypress`
232. `${device.label} is not a public Remote Start lane. Use manual countdown.`
233. `${device.label} is manual-only. Watch Sync will not send remote commands.`
234. `LG webOS needs a paired client key before GO can send Play.`
235. `/adb/media-key`
236. `Sony Bravia needs a Play IRCC code from remote-controller-info before GO can send Play.`
237. `Philips JointSpace PlayPause is a risky toggle, so GO will not send it automatically. Use manual countdown.`
238. `Roku Pause is not claimed safe for this Remote Start panel. Pause manually at the sync point.`
239. `Philips pause uses a PlayPause toggle-risk path, so Watch Sync does not expose it as safe pause.`
240. `${device.label} is manual-only or does not have a safe Pause command. Pause manually at the sync point.`
241. `LG webOS needs a paired client key before sending Pause.`
242. `pause`
243. `KEY_PAUSE`
244. `KEYCODE_MEDIA_PAUSE`
245. `No safe Pause command is available for this platform.`
246. `string`
247. `Enter a TV IP address or hostname first.`
248. `Enter a Home Assistant webhook URL first. Manual countdown still works.`
249. `/home-assistant/webhook`

## src/recommendations.ts
1. `./domain`
2. `netflix`
3. `Netflix`
4. `prime-video`
5. `Prime Video`
6. `disney-plus`
7. `Disney+`
8. `paramount-plus`
9. `Paramount+`
10. `max`
11. `Max`
12. `hulu`
13. `Hulu`
14. `peacock`
15. `Peacock`
16. `apple-tv-plus`
17. `Apple TV+`
18. `label`
19. `slug`
20. `US`
21. `popular`
22. `new`
23. `recent`
24. `mock`
25. `arrival-2016`
26. `movie`
27. `Arrival`
28. `2016`
29. `A thoughtful sci-fi drama about language, time, and connection — strong for a focused date-night watch.`
30. `TMDB User Rating`
31. `7.6`
32. `https://www.themoviedb.org/movie/329865-arrival`
33. `the-bear-2022`
34. `tv`
35. `The Bear`
36. `2022`
37. `Fast, emotional, and easy to discuss after each episode. Better for short synced sessions than a long movie.`
38. `8.2`
39. `https://www.themoviedb.org/tv/136315-the-bear`
40. `dune-part-two-2024`
41. `Dune: Part Two`
42. `2024`
43. `Big-screen sci-fi spectacle with strong shared-watch energy if both people can commit to the runtime.`
44. `8.1`
45. `https://www.themoviedb.org/movie/693134-dune-part-two`
46. `only-murders-2021`
47. `Only Murders in the Building`
48. `2021`
49. `Cozy mystery comedy with light cliffhangers and plenty to chat about between episodes.`
50. `8.0`
51. `https://www.themoviedb.org/tv/107113-only-murders-in-the-building`
52. `andor-2022`
53. `Andor`
54. `Prestige sci-fi with grounded tension. Best when both people want something more serious than background TV.`
55. `https://www.themoviedb.org/tv/83867-andor`
56. `poker-face-2023`
57. `Poker Face`
58. `2023`
59. `A case-of-the-week mystery comedy with easy episode-by-episode watch-party energy.`
60. `7.8`
61. `https://www.themoviedb.org/tv/120998-poker-face`
62. `severance-2022`
63. `Severance`
64. `A tense, premium mystery series that works well for couples who want theories between episodes.`
65. `8.4`
66. `https://www.themoviedb.org/tv/95396-severance`
67. `oppenheimer-2023`
68. `Oppenheimer`
69. `A long, intense prestige movie pick for nights when everyone is ready for a serious watch.`
70. `https://www.themoviedb.org/movie/872585-oppenheimer`
71. `mission-impossible-fallout-2018`
72. `Mission: Impossible — Fallout`
73. `2018`
74. `High-energy action that works well for groups because it is visual, fast, and easy to jump into.`
75. `7.4`
76. `https://www.themoviedb.org/movie/353081-mission-impossible-fallout`
77. `all`
78. `q`
79. `region`
80. `providers`
81. `,`
82. `/api/recommendations/tmdb?${params.toString()}`
83. `mediaType`
84. `category`
85. `/api/recommendations/discover?${params.toString()}`

## src/domain.ts
1. `tv_manual`
2. `laptop_auto`
3. `host`
4. `guest`
5. `idle`
6. `ready`
7. `counting`
8. `play`
9. `cancelled`
10. `pause`
11. `buffering`
12. `resync`
13. `next_episode`
14. `play_now`
15. `message`
16. `recommendation`
17. `mock`
18. `tmdb`
19. `omdb`
20. `movie`
21. `tv`
22. `up`
23. `down`
24. `participant_joined`
25. `participant_ready`
26. `setup_updated`
27. `countdown_started`
28. `countdown_cancelled`
29. `pause_requested`
30. `buffering_started`
31. `buffering_resolved`
32. `resync_requested`
33. `timestamp_submitted`
34. `chat_message`
35. `recommendation_sent`
36. `recommendation_voted`
37. `recommendation_selected`
38. `next_episode_requested`
39. `extension_paired`
40. `playback_status`
41. `extension_error`
42. `extension_command`
43. `00:00`
44. `${item.source}:${mediaType}:${idWithoutMediaPrefix}`
45. `local:${mediaType}:${normalizeRecommendationTitle(item.title)}:${normalizeRecommendationYear(item.year)}:${normalizeRecommendationProviders(item.providers)}`
46. `${prefix}_${random.replaceAll('-', '').slice(0, 10)}`
47. `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`
48. `string`
49. `boolean`
50. `number`
51. `object`
52. `NFKD`
53. `-`
54. `,`
55. `person`
56. `Host`
57. `Partner`
58. `GO — press play now.`
59. `Partner needs a pause — pause your TV now.`
60. `Partner is buffering — pause now.`
61. `Buffering fixed — both tap ready again.`
62. `RESYNC — seek manually to ${event.timestamp \|\| normalizedRoom.targetTimestamp}.`
63. `Recommended: ${event.item.title}`
64. `${event.vote === 'up' ? 'voted yes' : 'voted no'} on a recommendation.`
65. `Tonight's watch: ${event.item.title} — pause at 00:00, then ready up.`
66. `Next episode — pause at 00:00, then both tap ready.`
67. `Chrome extension paired.`
68. `Extension error: ${event.message.trim()}`
