# NOV25 Benchmark: adaptive recovery button and mission board

**Live link:** <https://cyberdude88.github.io/az-104-studylab/benchmark.html?b=nov25>
**Resume where the queue says:** <https://cyberdude88.github.io/az-104-studylab/benchmark.html?b=nov25#next>
**Open one mission:** `benchmark.html?b=nov25#m=<mission-id>` (for example `#m=peering`)

## 1. Source benchmark

| Field | Value |
|---|---|
| Date | 2026-11-25 |
| Source | AZ-104 practice exam, certification mode |
| Score | **43%**: 23/54 correct, 31 incorrect, 0 unanswered, 1h 38m |
| Review method | Playwright read the practice-exam report page; each item was tagged correct or incorrect from its result icon and mapped to its objective |
| Compared against | Google Sheet *AZ-104 Exam Readiness* (Question Log, Weak Concepts, Progress, Dashboard) |

### Domain and objective results

| Domain | NOV25 | TD Review Set 1 (4 Nov) | Objectives (NOV25) |
|---|---|---|---|
| Identity & governance | 55% | 80% | Entra users & groups 50 · Access to resources 100 · Subscriptions & governance 43 |
| Storage | 36% | 81.8% | Access to storage 100 · Storage accounts 50 · **Azure Files & Blob 17** |
| Compute | 36% | 63.2% | ARM/Bicep 40 · VMs 33 · App Service 33 |
| Networking | 36% | 66.7% | **Virtual networks 0** · Secure access 75 · DNS & LB 25 |
| Monitor & maintain | 50% | 66.7% | Monitor resources 67 · Backup & recovery 43 |

Score trend: 28 Oct timed exam about 60% (reconstructed, 609/1000 scaled) → 4 Nov Tutorials Dojo 71.6% → 25 Nov practice exam 43%. These come from different vendors in different formats, so read them as a direction, not as point-for-point deltas.

## 2. What recurs

These concepts appear in the Sheet as misses or weak areas before 25 Nov and were missed again on the benchmark. They get top priority in the queue.

| Mission | Earlier evidence (Sheet) | NOV25 miss |
|---|---|---|
| `peering`: both directions, never transitive | CONV-D4-Q12 peering non-transitivity (26 Oct); Weak Concepts | One-way peering stuck at *Initiated*; transitivity |
| `dns-delegation`: NS at registrar → Azure DNS | CONV-D4-Q16 subdomain delegation (26 Oct) | Delegating a new domain from the registrar |
| `vmss-manual`: Manual upgrade policy cmdlets | R3-Q5 Uniform vs Flexible; COMP-CUSTOMSCRIPT-Q11 | `Update-AzVmssInstance` under Manual policy |
| `mg-move`: management-group cmdlets | R3-Q7 MG nesting | Moving a subscription and deleting the empty MG |
| `policy-provider`: Azure Policy not working | CONV-D1-Q1 Deny on updates | `Microsoft.PolicyInsights` not registered |
| `restore-availset`: restore disks + template | THISCHAT-Q2 restore new VM vs CRR; snapshot vs Backup (weak) | Restore disks + template into an availability set |
| `layered-vnet`: subnets + service endpoints | VOICE-QUIZ-Q2, ADV-20261027-S1 service endpoint misses | Three-tier subnet plan with service endpoints |

**Slipped:** these were right before as multiple choice and wrong now in a different format.

| Mission | Before | NOV25 |
|---|---|---|
| `file-recovery` | MON-FILERECOVERY-Q8 correct (26 Oct) | Missed as a 4-step order |
| `blob-tiers` | R3-Q1 Archive rehydration correct (26 Oct) | Cold tier and "up to 15 hours" missed |

## 3. What improved

| Concept | October | NOV25 |
|---|---|---|
| Azure RBAC scope and role assignment | CONV-D1-Q4 Contributor can't assign roles, missed | 2/2 correct; objective 100% |
| SAS / storage access | R3-Q2 stored access policy, missed | SAS least privilege correct; objective 100% |
| NSG evaluation, ASGs | CONV-D4-Q6 missed → NET-NSGPRIORITY correct (4 Nov) | NSG DNS over UDP and ASG membership correct; secure access 75% |
| Private DNS zones | CONV-D4-Q13 auto-registration, missed | Private zone across VNets correct |
| Site Recovery and vault operations | Drilled in StudyLab (ASR churn, BV vs RSV) | Planned failover, High Churn, Backup reports correct |
| Storage redundancy | Drilled in StudyLab replication matrices | ZRS correct |

The topics with dedicated StudyLab drag-and-drop drills (RBAC tables, ASR churn, vault comparison, replication matrices) all held up. That is the reason this recovery uses the same format.

## 4. Patterns behind the score

1. **Format, not just concepts.** 13 of the 31 misses were build-it items: 8 PowerShell or Bicep fill-ins and 5 put-in-order sequences. The missions reproduce those formats as blanks to fill and slots to order.
2. **Recognition without recall.** The file-recovery and rehydration slips show the concept was recognized as multiple choice but couldn't be reproduced as steps or a number.
3. **Disputed keys.** Management-group cmdlets (the key gives `Remove-AzManagementGroupSubscription` where `Remove-AzManagementGroup` performs the deletion), Bastion ("browser only" is true for Basic SKU only), and Azure Files OS support (Server 2012 R2 does speak SMB 3.0). These missions teach the actual platform behavior and mark the key as disputed so a "wrong" answer there isn't over-weighted.

## 5. The custom button: adaptive design

The button sits at the top of the StudyLab home page (`index.html`, `#benchCta`). It is a link, not a JavaScript-only control, so it always works, even with storage blocked. On load, a small script reads the saved progress and rewrites the label, colour, ring and destination.

### States

| State (`data-state`) | Condition | Title | Destination | Accent |
|---|---|---|---|---|
| `new` | No mission played yet | "Fix the 31 missed concepts" plus the count of repeat misses | Mission board | Red: the benchmark is a fail |
| `due` | Any mission new or due today | "`N` due · `M` new · next: *mission*" | `#m=<top-of-queue>`, straight into the drill | Amber |
| `caught` | Nothing due; some still learning | "Caught up for today" plus the spaced-review count | Mission board | Blue |
| `cleared` | Every mission at mastery level | "Benchmark cleared: retake the practice exam" | Mission board (log the retake) | Green |

The ring shows **Recovery %**: the average mission level ÷ the mastery level. It only rises with spaced clean runs, not with time spent. The `aria-label` repeats the full state for screen readers.

### Queue and scheduling (`bench-core.js`)

* **Levels (boxes):** 0 → 5. A clean run (zero wrong placements) moves up one level, **at most once per calendar day**. Any wrong placement resets to level 0.
* **Mastered** means level ≥ 3, which takes three clean runs on three different days.
* **Next due:** level intervals of 0, 1, 2, 4, 7 and 14 days. A run with misses is due again the same day.
* **Priority:** due +40, new +30, recurring +25, slipped +15, plus 4 for each level below mastery, plus days since last played (capped at 14), plus 6 if the mission averages more than one wrong placement per run. Mastered missions get −50, so they only resurface when due.
* **Day streak:** consecutive calendar days with at least one finished run.

### Storage

* `localStorage["az104.benchmarks.v1"]`, keyed by benchmark id, so future benchmarks (for example `dec10`) sit beside `nov25`:

```json
{ "nov25": {
    "missions": { "peering": { "box": 1, "runs": 2, "clean": 1, "wrong": 1,
                               "last": "2026-11-25", "due": "2026-11-26",
                               "log": [{ "d": "2026-11-25", "wrong": 1, "xp": 90 }] } },
    "xp": 185, "days": ["2026-11-25"], "retakes": [{ "d": "2026-12-02", "score": 68 }] } }
```

* Nothing leaves the browser. **Export** downloads a JSON backup, **Import** restores it on another device, and **Reset** needs a second click within 3 seconds.
* **Log retake %** adds green bars to the score-trend chart.

### Mission board (`benchmark.html`)

* Header chips: Recovery %, mastered, to-do, XP, day streak.
* Hero action that follows the button's state.
* Adaptive queue: top 6 missions, with status, recurring, slipped and disputed badges, and level pips.
* Benchmark breakdown: domain bars, with a marker at the TD 4 Nov result, and the score trend.
* Three insight panels: **What recurs**, **What improved**, **Patterns**.
* Mission grid grouped by domain with objective percentages.

### Mission play

* A recurring or slipped mission shows its Sheet history in a banner above the brief.
* Cards pane on the left (sticky on desktop). On the right, a slot table: buckets, ordered steps, or script blanks marked `___`.
* Drag a card, or tap or press Enter on a card and then on a slot. Every slot is a real `<button>`.
* A right placement earns +10 XP, plus 5 on every third in a row, and shows the reason with a Microsoft Learn link. A wrong placement bounces the card back with the reason, ends the clean run, and adds to the wrong count.
* Finishing records the run, then offers **Next: *top of queue***, **Replay** and **Board**. After a run with misses, the prompt is to replay right away.
* Layout: a single column under 760px; reduced-motion is respected.

## 6. Mission catalog (28 missions, 165 cards, all 31 misses covered)

| Domain | Mission id | Format |
|---|---|---|
| Identity | `sspr` | True/False sort |
| Identity | `policy-provider` ↻ | Cause / fix / not-cause |
| Identity | `mg-move` ↻ ⚠ | Cmdlet → purpose |
| Identity | `budget-alerts` | Ordered steps + reject |
| Identity | `tags-merge` | Script blanks |
| Storage | `azcopy-sync` | Command parts + reject |
| Storage | `azcopy-auth` | Works / doesn't work |
| Storage | `blob-tiers` ⤵ | Tier buckets |
| Storage | `blob-versioning` | Creates version or not |
| Storage | `files-onprem` ⚠ | Requirement + OS buckets |
| Compute | `arm-clone` | Ordered steps |
| Compute | `bicep-advisor` | Declare / not |
| Compute | `bicep-deps` | Implicit / explicit / sequence / parallel |
| Compute | `vmss-manual` ↻ | Cmdlet → purpose |
| Compute | `ade-linux` | True/False |
| Compute | `autoscale-math` | Timeline |
| Compute | `webjobs` | True/False |
| Networking | `layered-vnet` ↻ | Three-tier subnet plan with service endpoints | Ordered steps |
| Networking | `peering` ↻ | Reachability + fix |
| Networking | `bastion` ⚠ | Ordered steps |
| Networking | `dns-delegation` ↻ | Delegating a new domain from the registrar | Ordered steps |
| Networking | `imds-lb` | Error → cause |
| Networking | `dns-recordset` | Script blanks |
| Monitor | `packet-capture` | Script blanks |
| Monitor | `file-recovery` ⤵ | Ordered steps |
| Monitor | `restore-availset` ↻ | Restore disks + template into an availability set | Ordered steps |
| Monitor | `vault-delete` | Ordered steps |
| Monitor | `vault-create` | Do / later / conflicts |

↻ recurring · ⤵ slipped · ⚠ answer key disputed. Scenarios are original paraphrases; all resource names, domains and addresses are fictional.

## 7. Adding the next benchmark

1. Copy `benchmarks/nov25.js` to `benchmarks/<id>.js` and set `id`, `title`, `date`, `score`, `domains`, `improved`, `patterns` and `missions`.
2. Add a `<script src="benchmarks/<id>.js">` to `benchmark.html`. Open it with `benchmark.html?b=<id>`.
3. Add a second CTA to `index.html` by copying the `#benchCta` block and script with the new id. Progress for each benchmark is stored separately under its id.
4. The Pages workflow already copies the whole `benchmarks/` folder.

## 8. Files

| File | Role |
|---|---|
| `bench-core.js` | Storage, levels, scheduling, queue, summary (shared) |
| `benchmarks/nov25.js` | NOV25 data: score, domains, insights, 28 missions |
| `benchmark.html` / `benchmark.js` | Mission board and drag-and-drop engine |
| `index.html` | Adaptive `#benchCta` button |
| `.github/workflows/pages.yml` | Copies the new files to the Pages artifact |

## 9. Notice

Personal study aid for temporary, non-commercial use only. See [`NOTICE.md`](../NOTICE.md). Scenarios are original paraphrases written for self-study; every resource name, domain, address and number is fictional. Not affiliated with, sponsored by or endorsed by Microsoft or any practice-test provider. No exam content is reproduced.
