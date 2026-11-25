# Complete the Script: adaptive design

**Live:** <https://cyberdude88.github.io/az-104-studylab/script.html>
**Start today's run:** `script.html#run`
**Open one script:** `script.html#s=<script-id>` (for example `#s=hub-spoke`)

A light-themed, editor-style game. Each scenario is a real Azure CLI, PowerShell, Bicep, ARM JSON or KQL script with tokens to fill in or fix. Every choice gets instant feedback and links back to Microsoft Learn. All companies, names, IPs and domains are fictional.

## 1. Two modes

| Mode | What you see | How you win | What counts as a miss |
|---|---|---|---|
| **Fill the blanks** | Blue dashed blanks in the code | Pick the right token for every blank | Each wrong pick (the token shakes, the reason is shown, then it resets) |
| **Fix the script** | A complete script, a red "what happened when it ran" box, and dotted tokens. Some tokens are bugs; the rest are decoys that are already right | Change every bug to the right token | Changing a decoy (it locks as verified and shows why it was right), or picking another wrong value for a bug |

On every pick, the feedback bar shows ✓ or ✗, the token, the reason, and a Learn link. **Hint** (counts as a miss) crosses out half the wrong options in a blank, or flags one bug line in fix mode. When the script is complete it "runs": the editor shows simulated terminal output, followed by a recap of every blank and why.

## 2. Deck (54 scripts)

| Primary domain | Scripts | Notes |
|---|---|---|
| Identity & governance | 10 | B2B guest invite, dynamic group, custom role, management group nesting, policy exemption (fix), locks (fix), tag inheritance and remediation, resource move, RBAC Administrator (fix), plus the cross-domain MI script |
| Storage | 9 | Data Lake ACLs, stored access policy, user delegation SAS, lifecycle JSON, object replication (fix), soft delete, Azure Files RBAC, AzCopy (fix), RA-GRS and failover |
| Compute | 13 | Snapshot to disk to VM, disk SKU (fix), availability set, Flexible VMSS repairs, VMSS Custom Script Extension (fix), autoscale, App Service slots, ACI, Container Apps, Bicep at subscription scope, ARM copy loop (fix), zonal VM and resize, Bicep web app |
| Networking | 14 | Hub-spoke gateway transit, UDR to NVA, UDR None (fix), NSG layers (fix), private endpoint DNS, service endpoint (fix), private DNS registration, DNS delegation, Standard LB, S2S VPN, NAT gateway, Network Watcher tool choice, branch landing zone, IR isolation (fix) |
| Monitor & maintain | 8 | Blob diagnostic settings, two KQL queries, alert stack, AMA + DCR, Cross Region Restore, Enhanced backup policy, file-level recovery |

13 scripts are fix-the-bug, and 26 span two or more domains (`branch-landing` touches all five). Languages: Azure CLI, PowerShell (Az and Microsoft Graph), Bicep, ARM JSON, KQL. Commands were checked against Microsoft Learn code samples.

## 3. Adaptive engine

Built on `bench-core.js` (bench id `cts`), using the same Leitner levels as NOV25. A clean run moves a script up one level once per day, any miss resets it to 0, and mastered means 3 clean runs on 3 different days.

**Concept heat.** Every script carries concept tags (`deck.js → concepts`).

`heat = base weight + 1.5 × misses here − 0.4 × first-try hits + 1 if a linked NOV25 mission isn't mastered yet`

| Base weight | Source |
|---|---|
| 3 | Missed before NOV25 and missed again on it: peering, DNS delegation, VMSS upgrade, management groups, Policy, VM restore, service endpoints |
| 2 | Missed on NOV25 or slipped (file recovery, blob tiers), or flagged High in the readiness tracker (UDR, NSG layers, private endpoints, HNS ACLs, snapshots, VMSS Flexible, Custom Script Extension, disk SKU, availability sets, IP flow verify, Policy Deny, RBAC assign, Entra guests) |
| 1 | New ground that AZ-104 keeps testing but the drills hadn't covered: locks, moves, custom roles, lifecycle, object replication, soft delete, redundancy, ACI, Container Apps, LB, VPN, NAT, diagnostic settings, KQL, alerts, AMA, managed identity |

**Script priority** = BenchCore queue priority (due +40, new +30, recurring +25, slipped +15, low level, staleness) **+ min(4 × hottest tag + sum of the other tags, 30) + 3 × past misses on its blanks** (capped at 5 misses).

**Today's run** takes 5 scripts from due and new items (it tops up from the rest of the queue if fewer than 5), at most 2 per primary domain, and always includes one fix-the-bug script. Run progress lives in `sessionStorage` (`cts.run`) for the day; levels and XP live in `localStorage` (`az104.benchmarks.v1 → cts`), next to NOV25.

**Board** shows script fluency (average level), mastered/total, to-do, XP, streak, the top 9 concepts by heat (select one to filter the grid), domain coverage, and filters (domain, cross-domain, fix, fill, due).

**Home button** (`#ctsCta`) is a white card on the dark home page with a live code teaser. After the first run it shows due/new counts, deep-links to `script.html#run`, and shows XP, streak and fluency.

### Google Sheet sync

`sync.js` (`window.LabSync`) can mirror progress to the owner's Google Sheet through `integrations/sheets-sync/Code.gs`. When connected:
- every finished run is queued and posted;
- the reply merges back levels (newest *Last played* wins), XP, days, retakes and concept priorities;
- heat gains `High +3 · Medium +1.5 · Low −1.5`, and `Ignore` drops the concept to the floor and hides it.

See [`integrations/sheets-sync/README.md`](../integrations/sheets-sync/README.md).

## 4. Data format (`scripts/deck.js`)

```js
S({id, mode:'complete'|'fix', lang:'azcli'|'pwsh'|'bicep'|'json'|'kql',
   domains:['networking','storage'], tags:['svc-endpoint'], file:'x.sh', title, scenario /*HTML*/,
   symptom /*fix mode*/, learn:[[label,url]],
   code:String.raw`… {{1}} …`,          // " ~" at a PowerShell line end becomes a backtick
   b:[{a:'answer' | ['a','b'], grp, o:[distractors], why, w:{distractor:reason}, bug /*fix*/, t /*tag*/}],
   out:['simulated output', …]})
```

To add a script: append an `S({...})`. Blank count must equal the number of `{{n}}` markers; every tag must exist in `concepts`. The validation one-liner used during build checks this, plus duplicate IDs and `w` keys.

## 5. Accessibility

Tokens are real buttons. The option menu is keyboard-navigable (↑/↓, Enter, Esc returns focus to the token). Feedback is announced through a `role="status"` region. Reduced-motion users get instant terminal output and no shake or pulse. On narrow screens the code scrolls inside the editor and the page itself doesn't scroll sideways.

## 6. Notice

Personal, temporary, non-commercial study aid. All scenarios are original and fictional; no exam or practice-test content is reproduced. Not affiliated with Microsoft. See [NOTICE.md](../NOTICE.md).
