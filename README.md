# AZ-104 StudyLab

A static, dependency-free study lab with interactive drills across all five AZ-104 domains:

- Identity and governance: RBAC scope, built-in role permissions table (allows vs does not allow), least-privilege role and scope table (root / to resource), policy, and locks
- Storage: resiliency, replication-change matrices (exam-prep table and current Microsoft Learn table), and Azure Files with on-premises AD DS
- Compute: VM availability and scale sets
- Networking: NSG troubleshooting, default rule priorities, and VNet peering
- Monitoring and maintenance: metric alerts, VM backup, RSV selection, Backup vault vs RSV comparison table, Site Recovery Normal vs High Churn cache storage, Network Watcher / Traffic Analytics, and Arc-based Connection Monitor setup

Drag an action into the answer table, or tap the action and then its destination. Correct placements turn green. The Backup vault placement challenge uses a larger inventory, XP, and streak scoring; it shows Microsoft Learn explanations only after a wrong placement.

## NOV25 Benchmark recovery

The home page has an adaptive **NOV25 Benchmark** button. It opens [`benchmark.html?b=nov25`](https://cyberdude88.github.io/az-104-studylab/benchmark.html?b=nov25), a mission board built from the 31 items missed on the 25 Nov 2026 practice exam attempt (43%). There are 28 drag-and-drop missions, with spaced review and XP/streaks. Progress is saved in browser `localStorage` (Export/Import included). Use `#next` to jump to the top of the queue, or `#m=<id>` to open one mission. Design notes: [`docs/NOV25_BENCHMARK_ADAPTIVE_DESIGN.md`](docs/NOV25_BENCHMARK_ADAPTIVE_DESIGN.md).

## Complete the Script

[`script.html`](https://cyberdude88.github.io/az-104-studylab/script.html) is a light, editor-style game with 54 fictional scenarios in Azure CLI, PowerShell, Bicep, ARM JSON and KQL, covering all five domains (26 of them span several domains). Fill each blank from a dropdown, or hunt the bugs in a broken script; every pick gets instant feedback and a Microsoft Learn link. An adaptive "Today's run" picks 5 scripts from your hottest concepts: NOV25 misses, tracker flags and misses made in the game. Design: [`docs/COMPLETE_THE_SCRIPT_DESIGN.md`](docs/COMPLETE_THE_SCRIPT_DESIGN.md).

## Live site

<https://cyberdude88.github.io/az-104-studylab/>

## Run locally

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open <http://127.0.0.1:4173>.

## Notice

Personal, non-commercial study aid, published temporarily for exam preparation. Not for commercial use or redistribution. Scenarios are original paraphrases with fictional names; no exam or practice-test content is reproduced. Not affiliated with or endorsed by Microsoft or any practice-test provider. Provided as is. See [NOTICE.md](NOTICE.md).
