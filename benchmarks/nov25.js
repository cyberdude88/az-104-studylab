/* NOV25 Benchmark — AZ-104 practice exam, certification-mode attempt, 25 Nov 2026: 43% (23/54).
   Every mission below maps to one or more missed items (src). Scenarios are paraphrased, not copied.
   Card tuple: [id, text, rowId, why, optionalLearnUrl]. Row tuple: [id, label, hint]. */
(function(){
const L='https://learn.microsoft.com/en-us/';
window.BENCHMARKS=window.BENCHMARKS||{};
window.BENCHMARKS.nov25={
  id:'nov25',
  title:'NOV25 Benchmark',
  date:'2026-11-25',
  source:'AZ-104 practice exam · Certification mode',
  score:{pct:43,correct:23,total:54,duration:'1h 38m'},
  domains:[
    {id:'identity',name:'Identity & governance',pct:55,prior:80,objectives:[['Entra users & groups',50],['Access to Azure resources',100],['Subscriptions & governance',43]]},
    {id:'storage',name:'Storage',pct:36,prior:81.8,objectives:[['Access to storage',100],['Storage accounts',50],['Azure Files & Blob',17]]},
    {id:'compute',name:'Compute',pct:36,prior:63.2,objectives:[['ARM / Bicep',40],['Virtual machines',33],['App Service',33]]},
    {id:'networking',name:'Networking',pct:36,prior:66.7,objectives:[['Virtual networks',0],['Secure access',75],['DNS & load balancing',25]]},
    {id:'monitor',name:'Monitor & maintain',pct:50,prior:66.7,objectives:[['Monitor resources',67],['Backup & recovery',43]]}
  ],
  priorLabel:'Tutorials Dojo Review Set 1 · 4 Nov (71.6%)',
  trend:[['28 Oct','Timed exam (reconstructed)',60],['4 Nov','Tutorials Dojo Review Set 1',71.6],['25 Nov','Practice exam (cert mode)',43]],
  improved:[
    ['Azure RBAC scope & role assignment','Missed 26 Oct (Contributor can’t assign roles) → 2/2 correct today · objective 100%'],
    ['SAS / storage access','Stored-access-policy miss 26 Oct → SAS least-privilege correct · objective 100%'],
    ['NSG evaluation & ASGs','Subnet+NIC miss 26 Oct → fixed 4 Nov → NSG DNS/UDP rule and ASG placement correct today'],
    ['Private DNS zones','Auto-registration miss 26 Oct → private zone across VNets correct today'],
    ['Site Recovery & vault ops','ASR planned failover, High Churn storage, Backup reports → Log Analytics all correct (StudyLab ASR/vault drills)'],
    ['Storage redundancy','ZRS choice correct (StudyLab replication matrices)']
  ],
  patterns:[
    '13 of 31 misses were build-it items: 8 PowerShell/Bicep fill-ins and 5 put-in-order sequences. Concept recall is ahead of cmdlet and step-order recall.',
    'Two concepts were right on an earlier multiple-choice attempt but missed today as a different format: file-level restore (now a 4-step sequence) and Archive rehydration (now “how long?”).',
    'The practice exam’s answer key is disputable on 3 items (management-group cmdlets, Bastion native client, Server 2012 R2 SMB). Those missions teach the platform behavior and flag the key.'
  ],
  missions:[
  /* ───────── Identity & governance ───────── */
  {id:'sspr',domain:'identity',src:['Q1'],title:'SSPR scope & methods',
   learn:L+'entra/identity/authentication/concept-sspr-howitworks',
   brief:'<b>Scenario:</b> Hybrid tenant — most users sync from on-prem AD, some are cloud-only. You are rolling out self-service password reset. Sort each statement.',
   rows:[['true','True','Accurate SSPR behaviour'],['false','False','Sounds right, isn’t']],
   cards:[
    ['s1','SSPR works for cloud-only users','true','Cloud-only passwords live in Entra ID, so SSPR resets them directly. Hybrid users need password writeback to push the reset back to AD DS.'],
    ['s2','SSPR can be enabled for All users or a Selected group','true','The SSPR scope is None, Selected (security group) or All.'],
    ['s3','SSPR can be scoped to an individual user account','false','Scoping is per group or all users. To target one person, put them in a group.'],
    ['s4','Mobile text message and voice call are valid SSPR methods','true','Mobile phone (SMS or voice), office phone, email, security questions and Microsoft Authenticator are SSPR methods.'],
    ['s5','Password writeback sends hybrid users’ new passwords back to on-prem AD DS','true','Writeback (Entra Connect / Cloud Sync) is what makes SSPR work end-to-end for synced users.'],
    ['s6','Security questions alone are the recommended single method','false','Security questions are the weakest method. Microsoft recommends pairing them with at least one other method.']
   ]},
  {id:'policy-provider',domain:'identity',src:['Q7'],recurring:true,
   history:'26 Oct: missed Azure Policy Deny on updates (CONV-D1-Q1). Policy remediation was correct. 25 Nov: missed the PolicyInsights provider registration.',
   title:'Azure Policy won’t work — why?',learn:L+'azure/azure-resource-manager/management/resource-providers-and-types',
   brief:'<b>Scenario:</b> New subscription. You hold <b>Resource Policy Contributor</b> at subscription scope and use Azure CLI 2.62. Your policies aren’t working. Find the root cause and the fix.',
   rows:[['cause','Root cause','The actual blocker'],['fix','Fix','The command that unblocks it'],['not','Not the cause','Already satisfied']],
   cards:[
    ['p1','The Microsoft.PolicyInsights resource provider isn’t registered','cause','Azure Policy compliance needs Microsoft.PolicyInsights registered in the subscription. A new subscription may not have it yet.'],
    ['p2','az provider register --namespace Microsoft.PolicyInsights','fix','This registers the provider. Check it with az provider show -n Microsoft.PolicyInsights --query registrationState.'],
    ['p3','Azure CLI 2.62 is too old for policy commands','not','2.62 is recent enough. Version isn’t the problem.'],
    ['p4','Resource Policy Contributor can’t create assignments','not','This role can create and manage policy definitions and assignments at its scope.'],
    ['p5','You need the Entra Global Administrator role','not','Entra directory roles don’t grant Azure resource permissions. Policy rights come from Azure RBAC.']
   ]},
  {id:'mg-move',domain:'identity',src:['Q9'],recurring:true,disputed:true,
   history:'26 Oct: missed management group nesting (R3-Q7). 25 Nov: missed moving a subscription between MGs and deleting the empty MG.',
   title:'Management-group cmdlets',learn:L+'azure/governance/management-groups/manage',
   brief:'<b>Scenario:</b> Fold the <b>Sales</b> management group into <b>Marketing</b>. Move subscription SalesSub under Marketing, then delete the empty Sales MG. Match each cmdlet to what it does.',
   rows:[['move','Move SalesSub under Marketing','A subscription has exactly one parent MG'],['detach','Detach a subscription from an MG','Sends it back to the root MG'],['delete','Delete the empty Sales MG','Only works once it has no children'],['rename','Rename an MG or change its parent','Edits the MG itself']],
   cards:[
    ['g1','New-AzManagementGroupSubscription -GroupName Marketing -SubscriptionId <id>','move','This associates the subscription with the target MG. Because a subscription can only have one parent, that moves it.'],
    ['g2','Remove-AzManagementGroupSubscription','detach','Removes the subscription from its current MG; it falls back under the root. The practice exam’s key counts this as part of the “move”.'],
    ['g3','Remove-AzManagementGroup -GroupName Sales','delete','Deletes a management group, but only an empty one. ⚠ The practice exam marked this wrong, yet it is the cmdlet that performs the deletion step in the scenario.'],
    ['g4','Update-AzManagementGroup','rename','Changes an MG’s display name or parent (-ParentId). It does not move subscriptions.']
   ]},
  {id:'budget-alerts',domain:'identity',src:['Q10'],title:'Budget alert fatigue',
   learn:L+'azure/cost-management-billing/costs/tutorial-acm-create-budgets',
   brief:'<b>Scenario:</b> A four-year-old monthly budget with one 100% alert is exceeded in week 1, so it emails every day. Finance wants accurate visibility and meaningful alerts. Order the two fixes and reject the rest.',
   rows:[['one','1 · Understand','Ground the budget in real data'],['two','2 · Re-baseline','Make alerts meaningful'],['no','Reject','Doesn’t fix alert noise']],
   cards:[
    ['b1','Review historical spend in Cost analysis','one','Trend data tells you what a realistic monthly budget is before you change it.'],
    ['b2','Set the budget to a realistic amount with staged thresholds (50 / 75 / 90 / 100%)','two','A realistic amount with graduated alerts replaces daily overrun spam with early warnings.'],
    ['b3','Assign the Finance Director Billing Reader','no','Gives visibility but does nothing about the broken budget or the email flood.'],
    ['b4','Enable cost anomaly detection','no','Anomaly detection catches unusual spikes. It doesn’t replace or tune budget thresholds.'],
    ['b5','Act on Azure Advisor cost recommendations','no','Advisor suggests savings but doesn’t change budget alerts.']
   ]},
  {id:'tags-merge',domain:'identity',src:['Q11'],title:'Add a tag without losing the old one',
   learn:L+'azure/azure-resource-manager/management/tag-resources-powershell',
   brief:'<b>Scenario:</b> Storage account <b>StorAcct1</b> in RG1 already has <code>Department=Marketing</code>. Add <code>Status=Approved</code> and keep the existing tag.<br><code>$tags = @{"Status"="Approved"}</code>',
   rows:[['get','$resource = ___ -Name StorAcct1 -ResourceGroupName RG1','Fetch the resource object'],['cmd','___ -ResourceId $resource.Id -Tag $tags','Edit the tags in place'],['op','-Operation ___','Keep the existing tags'],['no','Reject','Wrong scope or wipes the tags']],
   cards:[
    ['t1','Get-AzResource','get','Returns the storage account, including its .Id. Get-AzResourceGroup only returns resource groups.'],
    ['t2','Update-AzTag','cmd','Update-AzTag edits tags with -Operation Merge, Replace or Delete.'],
    ['t3','Merge','op','Merge adds or updates the given keys and leaves the others alone, so Department=Marketing survives.'],
    ['t4','New-AzTag','no','New-AzTag replaces the whole tag set on the target, so the Department tag would be lost.'],
    ['t5','Replace','no','Replace swaps the whole tag set; the existing tag is dropped.'],
    ['t6','Get-AzResourceGroup','no','This returns a resource group, not the storage account.']
   ]},

  /* ───────── Storage ───────── */
  {id:'azcopy-sync',domain:'storage',src:['Q13'],title:'Sync two file shares and purge temp files',
   learn:L+'azure/storage/common/storage-use-azcopy-files',
   brief:'<b>Scenario:</b> <b>share1</b> (SubscriptionA) is the source of record. <b>share2</b> (SubscriptionB) has picked up temp files. Bring them in line with the least time and cost.',
   rows:[['tool','Tool + command','One command, no manual compare'],['src','Source','The system of record'],['dst','Destination','Gets brought in line'],['flag','Flag that removes extras','Deletes files missing from the source'],['no','Reject','Slow, lossy or manual']],
   cards:[
    ['a1','azcopy sync','tool','sync compares last-modified times and copies only what changed. It is one command and scriptable.'],
    ['a2','share1','src','share1 is the source of record.'],
    ['a3','share2','dst','share2 is the destination brought in line with share1.'],
    ['a4','--delete-destination=true','flag','This deletes destination files that no longer exist in the source, which cleans up the temp files.'],
    ['a5','Compare and copy by hand in Storage Explorer','no','Manual, slow and error-prone.'],
    ['a6','Delete share2, then copy everything from share1','no','A full recopy is the most time and egress, and any edits made only in share2 are lost.'],
    ['a7','Create share3 and merge both into it','no','More manual work, plus every user has to remap a new share.']
   ]},
  {id:'azcopy-auth',domain:'storage',src:['Q16'],title:'AzCopy authorization by service',
   learn:L+'azure/storage/common/storage-use-azcopy-v10',
   brief:'<b>Scenario:</b> You copy into a storage account with AzCopy. You have account keys, Entra ID accounts and SAS tokens. The <b>Azure Files</b> commands target the share or the account. Sort each pairing.',
   rows:[['ok','Works','AzCopy accepts this'],['no','Doesn’t work','AzCopy rejects this']],
   cards:[
    ['z1','Blob · azcopy login (Microsoft Entra ID)','ok','For Blob, AzCopy accepts Entra ID (with Storage Blob Data role assignments) or SAS. Exam answer: Entra ID and SAS.',L+'azure/storage/common/storage-use-azcopy-authorize-azure-active-directory'],
    ['z2','Blob · SAS token appended to the URL','ok','SAS works for both Blob and Files.'],
    ['z3','Blob · storage account key','no','AzCopy doesn’t take account keys directly; you use a SAS (which may be generated from a key) or Entra ID.'],
    ['z4','Files (share- or account-level command) · SAS token','ok','A command that targets the share or account needs a SAS. Exam answer for Files here: SAS only.'],
    ['z5','Files (share- or account-level command) · Entra ID only','no','Entra ID for Files works only on commands that target files or directories, not the share or account.'],
    ['z6','Files (file/directory-level command) · Entra ID','ok','At file or directory level, AzCopy can use Entra ID and you can drop the SAS.'],
    ['z7','Files · storage account key','no','No account keys in AzCopy, for any service.']
   ]},
  {id:'blob-tiers',domain:'storage',src:['Q17','Q19'],regressed:true,
   history:'26 Oct: Archive rehydration was correct (R3-Q1). 25 Nov: missed the Cold tier choice and the up-to-15-hours rehydration time.',
   title:'Access tiers & rehydration',learn:L+'azure/storage/blobs/access-tiers-overview',
   brief:'<b>Scenario mix:</b> 2 TB kept for years, rarely read, but it must open <b>immediately</b> at the lowest cost. Separately, a lifecycle rule sends blobs straight to Archive. Match each fact to its tier.',
   rows:[['hot','Hot','Online · frequent access'],['cool','Cool','Online · ≥30-day minimum'],['cold','Cold','Online · ≥90-day minimum'],['arch','Archive','Offline · ≥180-day minimum']],
   cards:[
    ['k1','Highest storage cost, lowest access cost','hot','Hot is for active data; it costs the most per GB to store.'],
    ['k2','30-day early-deletion minimum','cool','Cool charges early deletion before 30 days.'],
    ['k3','2 TB for years, rarely read, must open immediately, cheapest online','cold','Cold is the cheapest tier that’s still online (90-day minimum). Archive is cheaper but offline. This was the 25 Nov answer.'],
    ['k4','90-day early-deletion minimum, still online','cold','Cold: online, read immediately, 90-day minimum.'],
    ['k5','Standard-priority rehydration takes up to 15 hours','arch','Archive blobs are offline. Standard rehydration takes up to 15 hours, not 24 hours or 15 days.',L+'azure/storage/blobs/archive-rehydrate-overview'],
    ['k6','High-priority rehydration under 1 hour for objects < 10 GB','arch','High priority costs more and is usually done within an hour for objects under 10 GB.',L+'azure/storage/blobs/archive-rehydrate-overview'],
    ['k7','180-day early-deletion minimum','arch','Archive has the longest minimum: 180 days.'],
    ['k8','tierToArchive with daysAfterModificationGreaterThan: 0','arch','That lifecycle rule archives blobs right after they’re written, so every later read needs a rehydration first.']
   ]},
  {id:'blob-versioning',domain:'storage',src:['Q21'],title:'Which writes create a blob version?',
   learn:L+'azure/storage/blobs/versioning-overview',
   brief:'<b>Scenario:</b> Blob versioning is on. Sort the REST operations: which <b>commit</b> a write that creates a new version?',
   rows:[['yes','Creates a new version','A committed write to the blob'],['no','No new version','Staging or page/append writes']],
   cards:[
    ['v1','Put Blob','yes','Creates or overwrites a block blob, which is a committed write and so a new version.'],
    ['v2','Put Block List','yes','Commits staged blocks. The commit is what creates the version.'],
    ['v3','Copy Blob','yes','Overwriting a destination blob makes a new version of it.'],
    ['v4','Set Blob Metadata','yes','Metadata changes count as writes, so they create a version too. This one is easy to miss.'],
    ['v5','Put Block','no','Only stages an uncommitted block; nothing is versioned until Put Block List.'],
    ['v6','Put Page','no','Page-blob range writes don’t create versions.'],
    ['v7','Append Block','no','Appending to an append blob doesn’t create a version.']
   ]},
  {id:'files-onprem',domain:'storage',src:['Q18','Q22'],disputed:true,
   history:'Weak concept from discussion: Blob vs Azure Files. 26 Oct: Files + AD DS was correct. 25 Nov: port 445 troubleshooting on a VM was correct, but the on-prem mount requirement and the OS support check were missed.',
   title:'Mount Azure Files from on-prem',learn:L+'azure/storage/files/storage-how-to-use-files-windows',
   brief:'<b>Scenario:</b> Premium file share, mounted <b>directly</b> over SMB from on-prem servers with the least effort. Sort the network requirement and each server.',
   rows:[['req','Required for a direct SMB mount','The minimum'],['sync','Only for Azure File Sync','Different feature'],['heavy','Works, but more effort','Over-engineered here'],['ok','Server supports mapping','SMB 3.x, recommended'],['up','Server should be upgraded','Per the exam key']],
   cards:[
    ['f1','Allow outbound TCP 445 through the on-prem firewall','req','SMB uses TCP 445. Opening it outbound is the only network requirement for a direct mount. Many ISPs block it.'],
    ['f2','Open TCP 443 and install the File Sync agent','sync','443 is what Azure File Sync uses. Sync caches shares on a server; it’s not a direct SMB mount.',L+'azure/storage/file-sync/file-sync-networking-overview'],
    ['f3','Build an ExpressRoute circuit','heavy','Private connectivity works but takes far more effort and cost than opening 445.'],
    ['f4','Windows Server 2022','ok','SMB 3.1.1. Supported and recommended.'],
    ['f5','Windows Server 2019','ok','SMB 3.1.1. Supported and recommended.'],
    ['f6','Windows Server 2016','ok','SMB 3.1.1. Supports mapping, as the explanation notes.'],
    ['f7','Windows Server 2012 R2','up','Exam key says upgrade. ⚠ In practice 2012 R2 speaks SMB 3.0 and can mount, but it’s out of support. SMB 2.1-only systems (2008 R2 / Win 7) can’t mount from on-prem at all.']
   ]},

  /* ───────── Compute ───────── */
  {id:'arm-clone',domain:'compute',src:['Q25'],title:'Deploy 15 identical VMs',
   learn:L+'azure/azure-resource-manager/templates/copy-resources',
   brief:'<b>Scenario:</b> 15 identical VMs based on an existing machine’s settings. Pick the repeatable path.',
   rows:[['one','1 · Describe','Infrastructure as code'],['two','2 · Repeat','Same definition ×15'],['three','3 · Deploy','Push it to Azure'],['no','Reject','Wrong format or manual cloning']],
   cards:[
    ['r1','Write (or export) a JSON ARM template that describes one VM','one','ARM templates are JSON (Bicep compiles to JSON). Exporting from an existing VM gives you a starting point.'],
    ['r2','Add a copy loop (count: 15) or pass instance parameters','two','copy / count repeats a resource definition without duplicating code.'],
    ['r3','New-AzResourceGroupDeployment (or az deployment group create)','three','PowerShell or CLI deploys the template. That was the answer on 25 Nov.'],
    ['r4','Describe the VM in an XML file','no','ARM doesn’t take XML; templates are JSON.'],
    ['r5','Build one VM, then copy it 14 times with CLI or PowerShell','no','Copying VMs by hand isn’t declarative or repeatable. Templates describe VMs before they exist.']
   ]},
  {id:'bicep-deps',domain:'compute',src:['Q27'],title:'Bicep: implicit vs explicit dependencies',
   learn:L+'azure/azure-resource-manager/bicep/resource-dependencies',
   brief:'<b>Code:</b> <code>otherResource</code> reads <code>PrimaryDnsZone.properties.nameServers</code>; <code>otherZone</code> declares <code>dependsOn: [ PrimaryDnsZone ]</code>. Sort each statement.',
   rows:[['imp','Implicit dependency','Created by a symbolic reference'],['exp','Explicit dependency','Created by dependsOn'],['seq','Deploys in sequence','Not in parallel'],['par','Deploys in parallel','No relationship']],
   cards:[
    ['d1','otherResource → PrimaryDnsZone','imp','Referencing another resource’s property makes Bicep add the dependency for you (implicit).'],
    ['d2','otherZone → PrimaryDnsZone','exp','dependsOn is an explicit dependency, so the “otherZone is implicitly dependent” statement is No.'],
    ['d3','PrimaryDnsZone, then otherZone','seq','Any dependency, implicit or explicit, makes ARM deploy them one after the other. So the “deployed in parallel” statement is No.'],
    ['d4','Two resources with no reference and no dependsOn','par','ARM deploys independent resources in parallel by default.']
   ]},
  {id:'bicep-advisor',domain:'compute',src:['Q26'],title:'Bicep: alert on new Advisor recommendations',
   learn:L+'azure/advisor/advisor-alerts-bicep',
   brief:'<b>Scenario:</b> In main.bicep, alert when Azure Advisor posts a new recommendation. Which two resource types do you declare?',
   rows:[['use','Declare in main.bicep','Advisor alert = activity log alert + action group'],['no','Not for this','Different signal type']],
   cards:[
    ['ad1','Microsoft.Insights/actionGroups','use','The action group says who to notify and how (email, SMS, webhook).'],
    ['ad2','Microsoft.Insights/activityLogAlerts','use','Advisor recommendations are Activity Log events (category Recommendation). Location is global.'],
    ['ad3','Microsoft.Insights/metricAlerts','no','Metric alerts fire on numeric metrics such as CPU. Advisor doesn’t emit a metric.'],
    ['ad4','Microsoft.Insights/dataCollectionRules','no','DCRs collect guest logs and counters through Azure Monitor Agent. They aren’t alerts.'],
    ['ad5','Microsoft.Insights/alertrules','no','This is the legacy classic alert type, not used for Advisor alerts.']
   ]},
  {id:'vmss-manual',domain:'compute',src:['Q28'],recurring:true,
   history:'26 Oct: missed VMSS Uniform vs Flexible (R3-Q5) and VMSS Custom Script Extension vs autoscale. 25 Nov: missed the Manual upgrade policy cmdlet.',
   title:'VMSS Manual upgrade policy',learn:L+'azure/virtual-machine-scale-sets/virtual-machine-scale-sets-upgrade-policy',
   brief:'<b>Scenario:</b> The scale set’s upgrade policy is <b>Manual</b>. You changed the model. Existing instances stay on the old model until you push it. Match each cmdlet to its job.',
   rows:[['model','Change the scale-set model','Step 1'],['push','Apply the model to existing instances','Step 2 under Manual policy'],['os','Rolling OS image upgrade','Image only'],['vm','Act on one instance (reimage, etc.)','Instance-level']],
   cards:[
    ['m1','Update-AzVmss','model','Updates the scale-set model only. Under Manual policy, existing VMs don’t change.'],
    ['m2','Update-AzVmssInstance -InstanceId *','push','Brings the chosen instances up to the latest model. This was the 25 Nov answer.'],
    ['m3','Start-AzVmssRollingOSUpgrade','os','Rolls out a new OS image in batches. It’s not a general model change.'],
    ['m4','Set-AzVmssVM','vm','Runs one-off actions such as reimage on a single instance.']
   ]},
  {id:'ade-linux',domain:'compute',src:['Q30'],title:'Azure Disk Encryption on a running Linux VM',
   learn:L+'azure/virtual-machines/linux/disk-encryption-linux',
   brief:'<b>Code:</b> <code>Set-AzVMDiskEncryptionExtension … -VolumeType \'Data\' -SequenceVersion ([Guid]::NewGuid()) -skipVmBackup</code> against a running Linux VM. Sort each statement.',
   rows:[['true','True','Accurate'],['false','False','Not how ADE works']],
   cards:[
    ['e1','The VM can stay running while encryption starts','true','ADE enables on a running IaaS VM; no stop is needed.'],
    ['e2','-VolumeType Data encrypts only the data volumes','true','On Linux, -VolumeType is required and can be OS, Data or All.'],
    ['e3','-SequenceVersion must be unique for each encryption operation on the VM','true','A new GUID per run makes the extension re-run the operation.'],
    ['e4','You must stop the VM first to avoid data loss','false','Stopping isn’t needed. (Snapshot or back up first as a best practice.)'],
    ['e5','-VolumeType is optional on Linux','false','It’s required for Linux VMs.']
   ]},
  {id:'autoscale-math',domain:'compute',src:['Q31'],title:'App Service autoscale timeline',
   learn:L+'azure/azure-monitor/autoscale/autoscale-get-started',
   brief:'<b>Rules:</b> scale out +2 when CPU ≥80% for 10 min · scale in −1 when CPU ≤30% for 25 min · 5-min cooldown · start 3, min 2, max 10.<br><b>Load:</b> 80% for 15 min, then 30% for 20 min. Fill in the timeline.',
   rows:[['t0','t = 0','Starting count'],['t10','t = 10 min','80% sustained for 10 min'],['t15','t = 15–35 min','30% for only 20 min'],['t35','t = 35 min','Answer'],['no','Reject','Decoys']],
   cards:[
    ['as1','3 instances','t0','That’s the initial count.'],
    ['as2','Scale out +2 → 5 instances, then a 5-min cooldown','t10','The 10-minute window is met, so +2 = 5. The cooldown and the drop to 30% at minute 15 stop a second scale-out.'],
    ['as3','No scale-in: 20 min < the 25-min window','t15','The scale-in rule needs 25 minutes at or below 30%; the load only stays there for 20.'],
    ['as4','5 instances','t35','The count stays at 5. The 25 Nov answer was 5.'],
    ['as5','7 instances','no','That needs a second scale-out, but CPU dropped at 15 minutes.'],
    ['as6','4 instances','no','That needs a scale-in, which needs 25 minutes of low CPU.']
   ]},
  {id:'webjobs',domain:'compute',src:['Q32'],title:'WebJobs on a Basic plan',
   learn:L+'azure/app-service/webjobs-create',
   brief:'<b>Scenario:</b> MyApp1 runs 2 instances on a <b>Basic</b> plan. Two scripts must run as WebJobs on <b>both</b> instances. Sort each statement.',
   rows:[['true','True','Required or accurate'],['false','False','Not required']],
   cards:[
    ['w1','The scripts must be continuous WebJobs','true','Continuous WebJobs run on every instance by default (you can limit them to one). Triggered WebJobs run on a single instance.'],
    ['w2','Triggered WebJobs run on just one instance','true','That’s why they can’t meet the both-instances requirement.'],
    ['w3','You must scale up to Standard S1','false','Basic supports WebJobs and Always On.'],
    ['w4','The WebJobs must be linked to a web project','false','Linking is a Visual Studio deployment option. You can also deploy by portal, CLI, ZIP or FTP.']
   ]},

  /* ───────── Networking ───────── */
  {id:'peering',domain:'networking',src:['Q35','Q36'],recurring:true,
   history:'26 Oct: missed VNet peering non-transitivity (CONV-D4-Q12), also on the Weak Concepts list. 25 Nov: missed again twice — one-way peering left “Initiated” and transitivity.',
   title:'Peering: both directions, never transitive',learn:L+'azure/virtual-network/virtual-network-peering-overview',
   brief:'<b>Topology:</b> peerings exist only vnet1→vnet2, vnet2→vnet3 and vnet3→vnet2 (non-overlapping /16s). Separately, VM1 can’t ping VM2 after a one-way <code>Add-AzVirtualNetworkPeering</code>, and the status shows <b>Initiated</b>. Sort it out.',
   rows:[['yes','Can communicate','Peering resource exists on both sides'],['nope','Cannot communicate','Missing reciprocal or transit'],['fix','Fix for VM1 → VM2','Makes it Connected'],['no','Reject','Doesn’t address the cause']],
   cards:[
    ['pe1','vnet2 ↔ vnet3','yes','Both sides have a peering resource, so the status is Connected.'],
    ['pe2','vnet1 ↔ vnet2','nope','Only vnet1 has a peering, so it stays Initiated. Traffic needs a peering resource in both VNets.'],
    ['pe3','vnet1 ↔ vnet3 (through vnet2)','nope','Peering isn’t transitive. You need a direct peering, or a hub NVA or gateway with UDRs.'],
    ['pe4','Add the reverse peering VNet2 → VNet1','fix','Add-AzVirtualNetworkPeering only creates one side. The portal can create both at once; PowerShell needs two calls.',L+'azure/virtual-network/virtual-network-manage-peering'],
    ['pe5','Create an NSG on both subnets','no','NSGs filter traffic; they can’t complete a peering. Windows Firewall was already opened.'],
    ['pe6','Move VM2 to the same region','no','Global VNet peering works across regions.'],
    ['pe7','Change VNet2’s address space','no','The ranges don’t overlap (10.10/16 and 10.20/16), so nothing needs changing.'],
    ['pe8','Deploy a VPN gateway','no','Peering doesn’t need a gateway.']
   ]},
  {id:'layered-vnet',domain:'networking',src:['Q34'],recurring:true,
   history:'Storage service endpoint + firewall missed 18 Oct (VOICE-QUIZ-Q2) and 27 Oct (ADV-S1). 25 Nov: missed the layered-app subnet plan with service endpoints.',
   title:'Three-tier network, minimum effort',learn:L+'azure/virtual-network/virtual-network-service-endpoints-overview',
   brief:'<b>Scenario:</b> Front-end VMs, back-end VMs and <b>Azure SQL Database</b>. Each layer needs independent filtering, with the least admin effort. Order four steps.',
   rows:[['one','1','Container'],['two','2','Network'],['three','3','Segmentation'],['four','4','Reach the PaaS tier'],['no','Reject','Extra effort or wrong count']],
   cards:[
    ['l1','Create a resource group','one','New app, new resource group.'],
    ['l2','Create a single VNet','two','One VNet connects every tier, so no peering is needed.'],
    ['l3','Create two subnets (front-end, back-end), each with its own NSG','three','Azure SQL Database is PaaS and doesn’t go in your subnet, so you need two subnets, not three.'],
    ['l4','Enable the Microsoft.Sql service endpoint on the subnets','four','Service endpoints plus a SQL VNet rule let the subnets reach SQL over the Azure backbone.'],
    ['l5','Create a VNet per layer','no','More VNets mean more peering and more admin.'],
    ['l6','Create three subnets','no','The database tier is PaaS and doesn’t need a subnet.'],
    ['l7','Configure peering on each VNet','no','With one VNet there’s nothing to peer.']
   ]},
  {id:'bastion',domain:'networking',src:['Q38'],disputed:true,title:'Azure Bastion build order',
   learn:L+'azure/bastion/configuration-settings',
   brief:'<b>Scenario:</b> vnet1 is 10.2.0.0/22 and subnet1 is 10.2.0.0/24. vm1 has no public IP. Use Bastion to RDP in from the internet.',
   rows:[['one','1','Prerequisite subnet'],['two','2','Deploy the service'],['three','3','Connect'],['no','Reject','Wrong name, size or approach']],
   cards:[
    ['ba1','Create AzureBastionSubnet as 10.2.1.0/26','one','The subnet must be named exactly AzureBastionSubnet, be /26 or larger, and sit inside the VNet’s space (10.2.1.0/26 fits the /22).'],
    ['ba2','Create Bastion and pick that existing subnet','two','Bastion deploys into AzureBastionSubnet with its own Standard public IP.'],
    ['ba3','Connect to vm1 from the Azure portal in a browser','three','Bastion relays RDP over TLS 443 to the VM’s private IP. ⚠ The exam key says browser only, which is true for Basic SKU. Standard/Premium SKU also allow the native client.'],
    ['ba4','Create BastionSubnet as 10.2.0.2/28','no','Wrong name, too small, and not a valid network address.'],
    ['ba5','Create a separate AzureBastionVNet 10.3.0.0/22','no','Bastion goes in the VM’s VNet (or a peered hub); a new isolated VNet doesn’t help.'],
    ['ba6','Add a Standard public IP to vm1','no','That defeats the point, because Bastion exists so the VM needs no public IP.']
   ]},
  {id:'dns-delegation',domain:'networking',src:['Q42'],recurring:true,
   history:'26 Oct: missed public DNS subdomain delegation with NS records (CONV-D4-Q16). 25 Nov: missed delegating a new domain from the registrar to Azure DNS.',
   title:'Make an Azure DNS zone resolvable',learn:L+'azure/dns/dns-delegate-domain-azure-dns',
   brief:'<b>Scenario:</b> company1.com is available to buy. Host its DNS in Azure DNS so it resolves on the internet, following best practice. Three actions.',
   rows:[['one','1','Own the name'],['two','2','Host the zone'],['three','3','Delegate'],['no','Reject','Automatic, impossible or the wrong direction']],
   cards:[
    ['dn1','Buy company1.com from a domain registrar','one','Azure DNS hosts zones; it doesn’t sell domains. (App Service Domains is a separate service.)'],
    ['dn2','Create the company1.com DNS zone in Azure','two','Azure assigns four name servers, such as ns1-0x.azure-dns.com/.net/.org/.info.'],
    ['dn3','At the registrar, set the NS records to the Azure name servers','three','Delegation lives in the parent, so the change is made at the registrar. Subdomains work the same way: add NS records in the parent zone.'],
    ['dn4','Buy the domain through Azure DNS','no','Azure DNS can’t register domains.'],
    ['dn5','Create NS records in the Azure zone','no','Azure creates the zone’s NS and SOA records automatically.'],
    ['dn6','Create an SOA record (in Azure or at the registrar)','no','The SOA is created automatically with the zone.'],
    ['dn7','Configure a reverse DNS zone','no','Reverse zones map IPs to names; this scenario needs forward resolution.']
   ]},
  {id:'dns-recordset',domain:'networking',src:['Q44'],title:'PowerShell: apex and round-robin www',
   learn:L+'azure/dns/dns-operations-recordsets',
   brief:'<b>Task:</b> Create an apex A record and a <code>www</code> A record set with two IPs (round robin). TTL is one hour. The zone already exists. Fill in the blanks.',
   rows:[['set','___ -Name "@" / "www" -RecordType A …','Create a record set'],['cfg','-DnsRecords (___ -IPv4Address …)','Build each record'],['ttl','-Ttl ___','One hour'],['no','Reject','Wrong cmdlet or unit']],
   cards:[
    ['ds1','New-AzDnsRecordSet','set','Creates a record set. "@" is the zone apex, and one set holding several A records gives you round robin.'],
    ['ds2','New-AzDnsRecordConfig','cfg','Builds one record object per IP; collect them in an array.'],
    ['ds3','3600','ttl','TTL is in seconds, so one hour is 3600.'],
    ['ds4','New-AzDnsZone','no','The zone already exists.'],
    ['ds5','Set-AzDnsRecordSet','no','Commits changes to an existing set. Here you are creating new sets.'],
    ['ds6','60','no','That’s one minute.']
   ]},
  {id:'imds-lb',domain:'networking',src:['Q43'],title:'IMDS load-balancer error codes',
   learn:L+'azure/load-balancer/troubleshoot-load-balancer-imds',
   brief:'<b>Scenario:</b> You query load-balancer metadata from the Instance Metadata Service (IMDS) inside a VM. Match each cause to the error it produces.',
   rows:[['nolb','404 · “No load balancer metadata is found”','LB metadata unavailable'],['path','404 · “API is not found: Path = …”','Bad request URL'],['rate','429 · “Too many requests”','Throttled']],
   cards:[
    ['im1','The VM isn’t behind a load balancer','nolb','No association means no LB metadata to return.'],
    ['im2','The load balancer is Basic SKU','nolb','IMDS LB metadata is available only for Standard LB.'],
    ['im3','The request path is misconfigured','path','A wrong path returns a different 404 message.'],
    ['im4','You hit the IMDS rate limit','rate','Throttling returns 429.']
   ]},

  /* ───────── Monitor & maintain ───────── */
  {id:'packet-capture',domain:'monitor',src:['Q46'],title:'Capture unknown SFTP traffic',
   learn:L+'azure/network-watcher/packet-capture-manage-powershell',
   brief:'<b>Scenario:</b> VM01 (10.0.0.3) makes outbound connections to an unknown SFTP server. Network Watcher is already on in East US. Fill in the script.',
   rows:[['type','Where ResourceType -eq ___','Find the existing watcher'],['rip','-RemoteIPAddress ___','Unknown remote server'],['lport','-LocalPort ___','Outbound, so ephemeral'],['rport','-RemotePort ___','SFTP'],['cmd','___ -NetworkWatcher … -Filter $filter1','Start the capture'],['no','Reject','Wrong value']],
   cards:[
    ['pc1','"Microsoft.Network/networkWatchers"','type','You look up the watcher itself. The capture resource doesn’t exist yet.'],
    ['pc2','"0.0.0.0-255.255.255.255"','rip','A range means any remote IP. A bare "0.0.0.0" isn’t a valid wildcard here.'],
    ['pc3','"1-65535"','lport','For outbound connections the local port is ephemeral, so allow any.'],
    ['pc4','"22"','rport','SFTP runs over SSH on TCP 22. FTPS uses 989/990, and FTP uses 20/21.'],
    ['pc5','New-AzNetworkWatcherPacketCapture','cmd','Creates the capture on VM01 (it needs the Network Watcher VM extension) and saves it to the storage account.'],
    ['pc6','"Microsoft.Network/networkWatchers/packetCaptures"','no','That’s the child type you’re about to create.'],
    ['pc7','"20-21"','no','Those are FTP ports, not SFTP.'],
    ['pc8','New-AzNetworkWatcher','no','A watcher already exists in East US.'],
    ['pc9','"0.0.0.0"','no','Not a valid “any” value for this filter.']
   ]},
  {id:'file-recovery',domain:'monitor',src:['Q48'],regressed:true,
   history:'26 Oct: individual file recovery was correct as multiple choice (MON-FILERECOVERY-Q8). 25 Nov: missed as a 4-step order. You know the concept; the gap is the step order.',
   title:'Restore one file from a VM backup',learn:L+'azure/backup/backup-azure-restore-files-from-vm',
   brief:'<b>Scenario:</b> Restore a config file on VM1 to its state six days ago, quickly, without touching other files. Order four steps.',
   rows:[['one','1','Pick the point in time'],['two','2','Expose the backup'],['three','3','Get the file'],['four','4','Clean up'],['no','Reject','Slower or wrong target']],
   cards:[
    ['fr1','Start File Recovery and select the recovery point from six days ago','one','In the vault, the VM’s backup item → File Recovery → choose the recovery point.'],
    ['fr2','Download and run the script on VM1 to mount the recovery volumes','two','The script mounts the snapshot as iSCSI volumes. Run it on VM1 so the copy is local.'],
    ['fr3','Copy the file from the mounted volume to VM1','three','Only that file comes back.'],
    ['fr4','Unmount the volumes','four','Close the connection from the portal, or it times out on its own after 12 hours.'],
    ['fr5','Mount the volume on VM2','no','You can, but running it on VM1 is fastest for a VM1 file.'],
    ['fr6','Restore the whole disk','no','Much slower, and it’s more than the scenario needs.'],
    ['fr7','Create a new VM','no','You don’t need a new VM to recover one file.']
   ]},
  {id:'restore-availset',domain:'monitor',src:['Q49'],recurring:true,
   history:'26 Oct: missed restoring a new VM vs Cross Region Restore (THISCHAT-Q2); snapshots vs Backup recovery was flagged weak. 25 Nov: missed the restore-disks-plus-template path into an availability set.',
   title:'Restore a deleted VM into its availability set',learn:L+'azure/backup/backup-azure-arm-restore-vms',
   brief:'<b>Scenario:</b> VMS1 was deleted. It was in an availability set and has a full VM backup. Recreate it in the same availability set.',
   rows:[['one','1','Point in time'],['two','2','Restore type'],['three','3','Rebuild with custom settings'],['no','Reject','Can’t place into the set']],
   cards:[
    ['ra1','Select a restore point for VMS1 in the Recovery Services vault','one','Restores always start from a recovery point.'],
    ['ra2','Restore type: Restore disks','two','You get managed disks plus a generated template, so you can control settings such as the availability set.'],
    ['ra3','Deploy the template the vault generated, setting the availability set','three','The template lets you add the availabilitySet property that Create virtual machine doesn’t expose.'],
    ['ra4','Restore type: Create a virtual machine','no','A quick-create VM with basic settings. You can’t put it in an existing availability set.'],
    ['ra5','Restore type: Replace existing','no','Needs the original VM to still exist, and it was deleted.'],
    ['ra6','Manually create a new VM','no','The vault’s template already does this.']
   ]},
  {id:'vault-delete',domain:'monitor',src:['Q51'],title:'Delete a Recovery Services vault',
   learn:L+'azure/backup/backup-azure-delete-vault',
   brief:'<b>Scenario:</b> Vault1 protects VM1 and VM2 under a shared policy. Other vaults and VMs exist. Delete Vault1 cleanly.',
   rows:[['one','1','Turn off the safety net'],['two','2','Release protected items'],['three','3','Purge leftovers'],['no','Reject','Destructive or blocked']],
   cards:[
    ['vd1','Disable soft delete (and security features) on Vault1','one','Soft delete is on by default and keeps deleted backup data for 14 days, which blocks deleting the vault.'],
    ['vd2','Stop backup of VM1 and VM2 and delete their backup data','two','A vault with registered or protected items can’t be deleted.'],
    ['vd3','Undelete soft-deleted items, then delete them permanently','three','Items already in soft-deleted state must be undeleted and deleted again to purge them.'],
    ['vd4','Delete VM1 and VM2','no','The VMs stay; only their protection in Vault1 goes.'],
    ['vd5','Delete the backup policy','no','A policy can’t be deleted while items use it, and deleting it doesn’t release the vault.']
   ]},
  {id:'vault-create',domain:'monitor',src:['Q53'],title:'New vault: protect and minimize cost',
   learn:L+'azure/backup/backup-azure-security-feature-cloud',
   brief:'<b>Scenario:</b> New Recovery Services vault for VMs <i>and other workloads</i>. Backups must survive accidental or malicious deletion for ≥14 days, at minimum cost, while meeting recovery-time targets. Pick the two vault actions.',
   rows:[['do','Do at vault level','Meets a requirement'],['later','Not a vault-creation step','Happens when you configure backup'],['no','Conflicts with requirements','Narrows scope / no benefit']],
   cards:[
    ['vc1','Enable soft delete for backup items','do','Soft delete keeps deleted backup data for 14 days by default (configurable 14–180).'],
    ['vc2','Choose LRS or GRS storage redundancy deliberately','do','This is the main cost lever. Set it before the first backup, because it can’t be changed after items are protected.'],
    ['vc3','Assign a backup policy','later','Policies are chosen when you enable backup for a workload, not when you create the vault.'],
    ['vc4','Limit the vault to Azure VMs only','no','The scenario needs VMs and other workloads, and one vault handles many types.'],
    ['vc5','Use one vault for multiple subscriptions','no','A Recovery Services vault protects workloads in its own subscription and region. This meets no requirement.']
   ]}
  ]
};
})();
