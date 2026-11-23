# AZ-104 StudyLab

A static, dependency-free study lab with interactive drills across all five AZ-104 domains:

- Identity and governance: RBAC scope, policy, and locks
- Storage: resiliency, replication-change matrices (exam-prep table and current Microsoft Learn table), and Azure Files with on-premises AD DS
- Compute: VM availability and scale sets
- Networking: NSG troubleshooting, default rule priorities, and VNet peering
- Monitoring and maintenance: metric alerts, VM backup, RSV selection, Network Watcher / Traffic Analytics, and Arc-based Connection Monitor setup

Drag an action into the answer table, or tap the action and then its destination. Correct placements turn green. The RSV workload challenge uses a larger inventory, XP, and streak scoring; it shows Microsoft Learn explanations only after a wrong placement.

## Live site

<https://cyberdude88.github.io/az-104-studylab/>

## Run locally

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Then open <http://127.0.0.1:4173>.
