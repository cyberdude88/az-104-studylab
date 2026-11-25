/* Complete the Script: deck of fictional, original scenarios (all names are made up).
   Each script: id, mode ('complete' | 'fix'), lang ('azcli' | 'pwsh' | 'bicep' | 'json' | 'kql'),
   domains (first = primary), tags (concept ids, see concepts), file, title, scenario (HTML),
   symptom (fix mode), learn [[label,url]], code (String.raw; {{n}} = blank n; " ~" at a PowerShell
   line end becomes a backtick), b (blanks, 1-based by position: a = answer (or array of answers,
   then grp names the shared pool), o = distractors, why, w = per-distractor reason, bug = the wrong
   value pre-filled in fix mode, t = concept override), out (simulated output). */
(function(){
const L='https://learn.microsoft.com/';
const concepts={
  /* weights: 3 = missed before and missed again on NOV25, 2 = missed on NOV25 or a High weak concept in the tracker, 1 = new ground that keeps appearing in AZ-104 objectives */
  'peering':{label:'VNet peering: both sides, non-transitive, gateway transit',w:3,src:'NOV25 repeat',nov:['peering','layered-vnet']},
  'dns-deleg':{label:'DNS delegation: NS records live in the parent',w:3,src:'NOV25 repeat',nov:['dns-delegation']},
  'vmss-upgrade':{label:'Scale set upgrade policy and pushing model changes',w:3,src:'NOV25 repeat',nov:['vmss-manual']},
  'mg':{label:'Management group hierarchy and subscription moves',w:3,src:'NOV25 repeat',nov:['mg-move']},
  'policy':{label:'Azure Policy assignment, scope and remediation',w:3,src:'NOV25 repeat',nov:['policy-provider']},
  'restore':{label:'VM restore options (restore disks, CRR, cross-zone)',w:3,src:'NOV25 repeat',nov:['restore-availset']},
  'svc-endpoint':{label:'Service endpoints + storage firewall',w:3,src:'NOV25 repeat',nov:['layered-vnet']},
  'file-recovery':{label:'File-level recovery from a VM backup',w:2,src:'NOV25 slipped',nov:['file-recovery']},
  'blob-tier':{label:'Blob tiers and lifecycle rules',w:2,src:'NOV25 slipped',nov:['blob-tiers']},
  'tags':{label:'Tags: merge, inherit, enforce',w:2,src:'NOV25 miss',nov:['tags-merge']},
  'azcopy':{label:'AzCopy copy/sync flags and auth',w:2,src:'NOV25 miss',nov:['azcopy-sync','azcopy-auth']},
  'bicep':{label:'Bicep / ARM structure, scope and loops',w:2,src:'NOV25 miss',nov:['bicep-deps','bicep-advisor','arm-clone']},
  'autoscale':{label:'Autoscale rules and syntax',w:2,src:'NOV25 miss',nov:['autoscale-math']},
  'vault':{label:'Recovery Services vault settings',w:2,src:'NOV25 miss',nov:['vault-create','vault-delete']},
  'blob-version':{label:'Blob versioning and change feed',w:2,src:'NOV25 miss',nov:['blob-versioning']},
  'app-service':{label:'App Service plans, slots and tiers',w:2,src:'NOV25 miss',nov:['webjobs']},
  'files':{label:'Azure Files access: SMB 445, share-level RBAC',w:2,src:'NOV25 miss',nov:['files-onprem']},
  'entra':{label:'Entra users, guests and groups',w:2,src:'Tracker: High',nov:['sspr']},
  'rbac':{label:'RBAC: who can assign roles, scope, least privilege',w:2,src:'Tracker: High'},
  'udr':{label:'UDRs: next hop types, longest prefix, NVA forwarding',w:2,src:'Tracker: High'},
  'nsg':{label:'NSG evaluation: subnet + NIC, priority order',w:2,src:'Tracker: High'},
  'private-endpoint':{label:'Private endpoints + privatelink DNS',w:2,src:'Tracker: High'},
  'hns-acl':{label:'Data Lake (HNS) ACLs: execute to traverse',w:2,src:'Tracker: High'},
  'snapshot':{label:'Snapshots vs backup: restore = new disk',w:2,src:'Tracker: High'},
  'vmss-flex':{label:'VMSS Flexible vs Uniform, automatic repairs',w:2,src:'Tracker: High'},
  'cse':{label:'Custom Script Extension on VMs and scale sets',w:2,src:'Tracker: High'},
  'disk-sku':{label:'Changing disk type needs deallocation',w:2,src:'Tracker: High'},
  'avset':{label:'Availability sets: fault and update domains',w:2,src:'Tracker: High'},
  'ipflow':{label:'Network Watcher: IP flow verify vs next hop vs flow logs',w:2,src:'Tracker: missed twice'},
  'policy-deny':{label:'Policy Deny effect and exemptions',w:2,src:'Tracker: High'},
  'private-dns':{label:'Private DNS zones: auto-registration links',w:1,src:'Tracker: Medium'},
  'sas':{label:'SAS types and stored access policies',w:1,src:'Tracker: review'},
  'backup-policy':{label:'Enhanced backup policy (hourly)',w:1,src:'Tracker: missed'},
  'lock':{label:'Resource locks: CanNotDelete vs ReadOnly',w:1,src:'New ground'},
  'move':{label:'Moving resources between groups',w:1,src:'New ground'},
  'custom-role':{label:'Custom RBAC roles',w:1,src:'New ground'},
  'lifecycle':{label:'Lifecycle management JSON',w:1,src:'New ground'},
  'obj-rep':{label:'Object replication prerequisites',w:1,src:'New ground'},
  'soft-delete':{label:'Soft delete for blobs, containers, shares',w:1,src:'New ground'},
  'redundancy':{label:'Storage redundancy and failover',w:1,src:'New ground'},
  'vm':{label:'VM create, zones, resize',w:1,src:'New ground'},
  'aci':{label:'Azure Container Instances',w:1,src:'New ground'},
  'aca':{label:'Azure Container Apps',w:1,src:'New ground'},
  'lb':{label:'Standard Load Balancer: probes and rules',w:1,src:'New ground'},
  'vpn':{label:'Site-to-site VPN gateway',w:1,src:'New ground'},
  'nat':{label:'NAT gateway outbound',w:1,src:'New ground'},
  'diag':{label:'Diagnostic settings to Log Analytics',w:1,src:'New ground'},
  'kql':{label:'KQL in Log Analytics',w:1,src:'New ground'},
  'alerts':{label:'Action groups, metric and activity log alerts',w:1,src:'New ground'},
  'ama':{label:'Azure Monitor Agent + data collection rules',w:1,src:'New ground'},
  'mi':{label:'Managed identities + data-plane roles',w:1,src:'New ground'}
};

const s=[];const S=o=>s.push(o);

/* ═════════════ IDENTITY & GOVERNANCE ═════════════ */
S({id:'guest-auditor',mode:'complete',lang:'pwsh',domains:['identity'],tags:['entra','rbac'],file:'invite-auditor.ps1',
title:'Invite an external auditor, read-only, one resource group',
scenario:'Ledgerwyn (an outside audit firm) needs <b>read-only</b> access to <code>rg-finance-audit</code> at Orrin &amp; Pell Law for one quarter. They sign in with their own company accounts. Nothing else in the subscription should be visible to them.',
learn:[['Invite a guest with PowerShell',L+'entra/external-id/b2b-quickstart-invite-powershell'],['Assign Azure roles with PowerShell',L+'azure/role-based-access-control/role-assignments-powershell']],
code:String.raw`Connect-MgGraph -Scopes "User.Invite.All","GroupMember.ReadWrite.All"

$inv = {{1}} -InvitedUserEmailAddress "lead@ledgerwyn.example" ~
    -InvitedUserDisplayName "Ledgerwyn Lead" ~
    -InviteRedirectUrl "https://myapps.microsoft.com" ~
    {{2}}

New-MgGroupMember -GroupId $auditors.Id -DirectoryObjectId $inv.InvitedUser.Id

New-AzRoleAssignment -ObjectId $inv.InvitedUser.Id ~
    -RoleDefinitionName {{3}} ~
    -Scope {{4}}`,
b:[{a:'New-MgInvitation',o:['New-MgUser','New-MgGuestUser','New-AzADUser'],t:'entra',why:'B2B guests are created by an invitation. <code>New-MgInvitation</code> creates the guest object and (optionally) emails the redeem link.',w:{'New-MgUser':'Creates a member account in your tenant with a password you manage. The auditor wants to use their own company identity.','New-MgGuestUser':'Not a real cmdlet. Guests come from invitations.','New-AzADUser':'Creates a member user; there is no B2B invitation flow in it.'}},
{a:'-SendInvitationMessage:$true',o:['-UserType Guest','-ForceChangePasswordNextSignIn','-AccountEnabled'],t:'entra',why:'Without <code>-SendInvitationMessage</code> no email goes out; you would have to hand them the redeem URL yourself.',w:{'-UserType Guest':'Not a parameter of New-MgInvitation (the property is InvitedUserType, and it already defaults to Guest).','-ForceChangePasswordNextSignIn':'Guests keep the password from their home tenant; you never set one.','-AccountEnabled':'Belongs to New-MgUser, not to invitations.'}},
{a:'"Reader"',o:['"Contributor"','"User Access Administrator"','"Owner"'],t:'rbac',why:'<b>Reader</b> views everything in scope and changes nothing: least privilege for an audit.',w:{'"Contributor"':'Can create, change and delete resources. Far more than read-only.','"User Access Administrator"':'Lets them grant access to others. An auditor must not hand out roles.','"Owner"':'Full control, including access management.'}},
{a:'"/subscriptions/$subId/resourceGroups/rg-finance-audit"',o:['"/subscriptions/$subId"','"/providers/Microsoft.Management/managementGroups/mg-root"','"rg-finance-audit"'],t:'rbac',why:'Scope the assignment to the one resource group. Everything inside it inherits Reader; nothing outside does.',w:{'"/subscriptions/$subId"':'The whole subscription becomes visible. The brief says one resource group only.','"/providers/Microsoft.Management/managementGroups/mg-root"':'Every subscription under the root group inherits it.','"rg-finance-audit"':'-Scope needs a full resource ID, not a bare name.'}}],
out:['Id                                   InviteRedeemUrl','----                                 ---------------','6b1f…e2d0                            https://login.microsoftonline.com/redeem?rd=…','RoleDefinitionName : Reader','Scope              : /subscriptions/…/resourceGroups/rg-finance-audit']});

S({id:'dynamic-group',mode:'complete',lang:'pwsh',domains:['identity'],tags:['entra'],file:'sales-dynamic-group.ps1',
title:'Dynamic security group for the sales team',
scenario:'Mossgate Outdoor wants every <b>enabled</b> user whose department is <b>Sales</b> to land in one security group automatically, with membership updating as HR edits profiles. The tenant has Entra ID P1.',
learn:[['Dynamic membership rules',L+'entra/identity/users/groups-dynamic-membership'],['Create a dynamic group',L+'entra/identity/users/groups-create-rule']],
code:String.raw`Connect-MgGraph -Scopes "Group.ReadWrite.All"

New-MgGroup -DisplayName "grp-sales-dynamic" ~
    -MailEnabled:$false -MailNickname "grpsalesdyn" ~
    -SecurityEnabled:$true ~
    -GroupTypes {{1}} ~
    -MembershipRule {{2}} ~
    -MembershipRuleProcessingState {{3}}`,
b:[{a:'"DynamicMembership"',o:['"Unified"','"Assigned"','"Security"'],why:'<code>DynamicMembership</code> in GroupTypes is what makes Entra evaluate a rule instead of a hand-kept member list. Dynamic groups need Entra ID P1 (or higher) for the users in scope.',w:{'"Unified"':'Makes it a Microsoft 365 group, not a dynamic group.','"Assigned"':'Not a GroupTypes value; assigned membership is what you get when you leave DynamicMembership out.','"Security"':'Security is set by -SecurityEnabled, not GroupTypes.'}},
{a:`'(user.department -eq "Sales") -and (user.accountEnabled -eq true)'`,o:[`'(user.department -eq Sales) -and (user.accountEnabled -eq true)'`,`'user.department == "Sales"'`,`'(device.department -eq "Sales")'`],why:'Rule syntax uses PowerShell-style operators (<code>-eq</code>, <code>-and</code>); string values go in double quotes, booleans do not.',w:{[`'(user.department -eq Sales) -and (user.accountEnabled -eq true)'`]:'String values must be quoted: "Sales".',[`'user.department == "Sales"'`]:'== is not a rule operator; use -eq. It also misses the enabled-account condition.',[`'(device.department -eq "Sales")'`]:'device.* rules are for device groups, and devices have no department property.'}},
{a:'"On"',o:['"Paused"','"Enabled"','"Active"'],why:'<code>On</code> starts evaluating the rule; <code>Paused</code> keeps the group frozen.',w:{'"Paused"':'The rule would be saved but never applied.','"Enabled"':'Not a valid value. Valid values are On and Paused.','"Active"':'Not a valid value. Valid values are On and Paused.'}}],
out:['DisplayName        Id                                   GroupTypes','-----------        --                                   ----------','grp-sales-dynamic  0c8e…91af                            {DynamicMembership}','MembershipRuleProcessingState : On   (initial evaluation can take a while)']});

S({id:'custom-role',mode:'complete',lang:'pwsh',domains:['identity','compute'],tags:['custom-role','rbac'],file:'vm-operator-role.ps1',
title:'Custom role: start and restart VMs, nothing more',
scenario:'Brindlewick Robotics night operators may <b>view, start and restart</b> VMs in the production subscription. They must not resize, delete or deallocate anything. Build a custom role by cloning a built-in one.',
learn:[['Create a custom role with PowerShell',L+'azure/role-based-access-control/custom-roles-powershell'],['Custom role properties',L+'azure/role-based-access-control/custom-roles']],
code:String.raw`$role = Get-AzRoleDefinition -Name "Virtual Machine Contributor"
$role.Id = $null
$role.IsCustom = $true
$role.Name = "VM Night Operator"
$role.Description = "View, start and restart VMs."
$role.Actions.Clear()
$role.Actions.Add("Microsoft.Compute/virtualMachines/read")
$role.Actions.Add({{1}})
$role.Actions.Add({{2}})
$role.AssignableScopes.Clear()
$role.AssignableScopes.Add({{3}})
{{4}} -Role $role`,
b:[{a:['"Microsoft.Compute/virtualMachines/start/action"','"Microsoft.Compute/virtualMachines/restart/action"'],grp:'vmops',o:['"Microsoft.Compute/virtualMachines/deallocate/action"','"Microsoft.Compute/virtualMachines/write"','"Microsoft.Compute/virtualMachines/*"'],why:'Actions are listed per operation: <code>start/action</code> and <code>restart/action</code> cover exactly what the brief allows.',w:{'"Microsoft.Compute/virtualMachines/deallocate/action"':'Deallocate was explicitly ruled out.','"Microsoft.Compute/virtualMachines/write"':'write = create or change VMs, including resize.','"Microsoft.Compute/virtualMachines/*"':'Wildcard grants every VM action, delete included.'}},
{a:['"Microsoft.Compute/virtualMachines/start/action"','"Microsoft.Compute/virtualMachines/restart/action"'],grp:'vmops',o:['"Microsoft.Compute/virtualMachines/deallocate/action"','"Microsoft.Compute/virtualMachines/write"','"Microsoft.Compute/virtualMachines/*"'],why:'The second operation completes the pair (start + restart).',w:{'"Microsoft.Compute/virtualMachines/deallocate/action"':'Deallocate was explicitly ruled out.','"Microsoft.Compute/virtualMachines/write"':'write = create or change VMs, including resize.','"Microsoft.Compute/virtualMachines/*"':'Wildcard grants every VM action, delete included.'}},
{a:'"/subscriptions/$prodSubId"',o:['"/subscriptions/*"','"Production"','"/subscriptions/$prodSubId/resourceGroups/*"'],why:'AssignableScopes lists where the role may be assigned, as full scope IDs.',w:{'"/subscriptions/*"':'Wildcards are not allowed in AssignableScopes.','"Production"':'A display name is not a scope; use the ID.','"/subscriptions/$prodSubId/resourceGroups/*"':'Wildcards are not allowed in AssignableScopes.'}},
{a:'New-AzRoleDefinition',o:['Set-AzRoleDefinition','New-AzRoleAssignment','Add-AzRoleDefinition'],why:'<code>New-AzRoleDefinition</code> creates the custom role. Assigning it to the operators is a separate <code>New-AzRoleAssignment</code>.',w:{'Set-AzRoleDefinition':'Updates an existing custom role; this one doesn’t exist yet.','New-AzRoleAssignment':'Assigns a role that already exists; it doesn’t create one.','Add-AzRoleDefinition':'Not a real cmdlet.'}}],
out:['Name             : VM Night Operator','IsCustom         : True','Actions          : {Microsoft.Compute/virtualMachines/read, …/start/action, …/restart/action}','AssignableScopes : {/subscriptions/…}']});

S({id:'mg-hierarchy',mode:'complete',lang:'azcli',domains:['identity'],tags:['mg','policy'],file:'mg-hierarchy.sh',
title:'Nest management groups, move a subscription, assign policy once',
scenario:'Mossgate Outdoor: create <code>mg-mossgt</code> under the tenant root, nest <code>mg-mossgt-retail</code> under it, move <code>sub-retail-prod</code> into the retail group, then restrict <b>every retail subscription, now and future</b> to the two Canadian regions.',
learn:[['Management groups overview',L+'azure/governance/management-groups/overview'],['Assign policy with Azure CLI',L+'azure/governance/policy/assign-policy-azurecli']],
code:String.raw`az account management-group create --name mg-mossgt --display-name "Mossgate Outdoor"

az account management-group create --name mg-mossgt-retail \
  --display-name "Retail" {{1}} mg-mossgt

az account management-group subscription add \
  --name {{2}} --subscription "sub-retail-prod"

az policy assignment create --name allowed-regions \
  --policy "$ALLOWED_LOCATIONS_DEF_ID" \
  --scope {{3}} \
  --params '{ "listOfAllowedLocations": { "value": ["canadacentral","canadaeast"] } }'`,
b:[{a:'--parent',o:['--parent-group','--management-group','--root'],t:'mg',why:'<code>--parent</code> (name or ID) nests the new group. Without it, the group lands directly under the tenant root.',w:{'--parent-group':'Not a parameter.','--management-group':'Not a parameter of create.','--root':'Not a parameter; root is the default parent.'}},
{a:'mg-mossgt-retail',o:['mg-mossgt','"Tenant Root Group"'],t:'mg',why:'Moving a subscription = adding it to the new group. It can only have one parent, so it leaves its old one.',w:{'mg-mossgt':'One level too high. Retail policy should apply to retail subscriptions only.','"Tenant Root Group"':'That’s where it probably already is.'}},
{a:'"/providers/Microsoft.Management/managementGroups/mg-mossgt-retail"',o:['"/subscriptions/sub-retail-prod"','"mg-mossgt-retail"','"/managementGroups/mg-mossgt-retail"'],t:'policy',why:'Assigning at the management group means every subscription placed in it later inherits the restriction.',w:{'"/subscriptions/sub-retail-prod"':'Covers one subscription, not future ones.','"mg-mossgt-retail"':'Scope must be the full resource ID.','"/managementGroups/mg-mossgt-retail"':'Missing the /providers/Microsoft.Management prefix.'}}],
out:['{ "name": "mg-mossgt-retail", "details": { "parent": { "name": "mg-mossgt" } } }','Subscription sub-retail-prod → mg-mossgt-retail','{ "name": "allowed-regions", "scope": "/providers/Microsoft.Management/managementGroups/mg-mossgt-retail" }']});

S({id:'policy-exemption',mode:'fix',lang:'pwsh',domains:['identity'],tags:['policy-deny','policy'],file:'exempt-legacy.ps1',
title:'Fix it: a 30-day policy exemption that never worked',
scenario:'A <b>Deny</b> policy requires a <code>CostCenter</code> tag on every resource. The legacy migration in <code>rg-legacy-migration</code> needs a <b>temporary waiver for 30 days</b>. A colleague wrote this; it fails.',
symptom:'New-AzPolicyExemption: InvalidRequestContent – the scope "rg-legacy-migration" is not a valid resource ID.\nAfter fixing that by hand, the exemption shows as already expired.',
learn:[['Policy exemption structure',L+'azure/governance/policy/concepts/exemption-structure'],['Deny effect',L+'azure/governance/policy/concepts/effect-deny']],
code:String.raw`$assign = Get-AzPolicyAssignment -Name "deny-missing-costcenter" -Scope "/subscriptions/$subId"
$rg = Get-AzResourceGroup -Name "rg-legacy-migration"

New-AzPolicyExemption -Name "legacy-migration-30d" ~
    -PolicyAssignment $assign ~
    -Scope {{1}} ~
    -ExemptionCategory {{2}} ~
    -ExpiresOn {{3}}`,
b:[{a:'$rg.ResourceId',bug:'$rg.ResourceGroupName',o:['$assign.Scope'],why:'-Scope takes a resource ID such as <code>/subscriptions/…/resourceGroups/rg-legacy-migration</code>.',w:{'$rg.ResourceGroupName':'Just the name. Scope needs the full ID.','$assign.Scope':'That is the subscription; it would exempt everything.'}},
{a:'Waiver',o:['Mitigated','Exception','Temporary'],why:'<b>Waiver</b> = accepted non-compliance for now. <b>Mitigated</b> = the intent is met another way. (This line was already right.)',w:{'Mitigated':'Mitigated means the policy intent is met by other means. Here you are knowingly non-compliant: Waiver.','Exception':'Not a category. Only Waiver and Mitigated exist.','Temporary':'Not a category. Expiry is set with -ExpiresOn.'}},
{a:'(Get-Date).AddDays(30)',bug:'(Get-Date).AddDays(-30)',o:['(Get-Date).AddMonths(-1)'],why:'Expiry must be in the future; after it, Deny applies again automatically.',w:{'(Get-Date).AddDays(-30)':'In the past, so it expired before it started.','(Get-Date).AddMonths(-1)':'Still in the past.'}}],
out:['Name               : legacy-migration-30d','ExemptionCategory  : Waiver','ExpiresOn          : 2026-12-25T…','Scope              : /subscriptions/…/resourceGroups/rg-legacy-migration','Note: Deny blocks new and updated non-compliant resources; existing ones are only reported.']});

S({id:'lock-trap',mode:'fix',lang:'azcli',domains:['identity','storage'],tags:['lock'],file:'locks.sh',
title:'Fix it: the lock that broke key rotation',
scenario:'Tallowmere Studios: production (<code>rg-tallow-prod</code>) must stay <b>fully manageable</b> (scale, restart, rotate storage keys) but nothing may be <b>deleted</b>. The DNS resource group must be <b>frozen against any change</b> during a migration.',
symptom:'Key rotation job: ScopeLocked – "The scope … cannot perform write operation because the following scope(s) are locked: rg-tallow-prod".\nlistKeys is a POST, so a ReadOnly lock blocks it.',
learn:[['Lock resources',L+'azure/azure-resource-manager/management/lock-resources']],
code:String.raw`# Run as Owner or User Access Administrator (needs Microsoft.Authorization/locks/*)
az lock create --name keep-prod \
  --resource-group rg-tallow-prod \
  --lock-type {{1}} \
  --notes "Stop accidental deletes"

az lock create --name freeze-dns \
  --resource-group rg-tallow-dns \
  --lock-type {{2}} \
  --notes "Migration window"`,
b:[{a:'CanNotDelete',bug:'ReadOnly',o:['DoNotDelete'],why:'<b>CanNotDelete</b>: read and modify are fine, delete is blocked. Key rotation keeps working.',w:{'ReadOnly':'ReadOnly blocks every write and POST, including listKeys and regenerating keys.','DoNotDelete':'Not an API value. The portal label is “Delete”; the value is CanNotDelete.'}},
{a:'ReadOnly',o:['CanNotDelete','Freeze'],why:'<b>ReadOnly</b> is what you want for a freeze: no changes, no deletes. (This line was already right.)',w:{'CanNotDelete':'Would still allow record changes. The brief says no change at all.','Freeze':'Not a lock type.'}}],
out:['{ "level": "CanNotDelete", "name": "keep-prod" }','{ "level": "ReadOnly", "name": "freeze-dns" }','az storage account keys renew … → OK']});

S({id:'tag-inherit',mode:'complete',lang:'azcli',domains:['identity'],tags:['tags','policy'],file:'inherit-costcenter.sh',
title:'Inherit CostCenter from the resource group, then backfill',
scenario:'Orrin &amp; Pell Law: every resource in <code>rg-orrin-legal</code> should carry the resource group’s <code>CostCenter</code> tag. New resources get it automatically, and the <b>200 existing</b> resources must be fixed too.',
learn:[['Remediate non-compliant resources',L+'azure/governance/policy/how-to/remediate-resources'],['Modify effect',L+'azure/governance/policy/concepts/effect-modify']],
code:String.raw`# Built-in: "Inherit a tag from the resource group if missing"   effect: {{1}}
az policy assignment create --name inherit-costcenter \
  --policy "$INHERIT_TAG_IF_MISSING" \
  --scope "/subscriptions/$SUB/resourceGroups/rg-orrin-legal" \
  --params '{ "tagName": { "value": "CostCenter" } }' \
  {{2}} --location canadacentral

az policy {{3}} create --name backfill-costcenter \
  --resource-group rg-orrin-legal \
  --policy-assignment inherit-costcenter`,
b:[{a:'Modify',o:['Append','DeployIfNotExists','Deny'],t:'policy',why:'Tag inheritance policies use <b>Modify</b>, which can add or replace tags on create or update, and can be remediated.',w:{'Append':'Append adds fields but can’t be remediated on existing resources the same way; the tag built-ins use Modify.','DeployIfNotExists':'Deploys a related resource (like an extension); it doesn’t edit tags.','Deny':'Would block resources without the tag instead of fixing them.'}},
{a:'--mi-system-assigned',o:['--enforcement-mode DoNotEnforce','--not-scopes rg-orrin-legal'],t:'policy',why:'Modify and DeployIfNotExists assignments need a <b>managed identity</b>; it is the identity that edits resources during remediation.',w:{'--enforcement-mode DoNotEnforce':'Turns the effect off: audit-only.','--not-scopes rg-orrin-legal':'Excludes the very group you are targeting.'}},
{a:'remediation',o:['state trigger-scan','exemption','assignment update'],t:'tags',why:'Modify only acts on new or updated resources. Existing resources need a <b>remediation task</b>.',w:{'state trigger-scan':'Re-evaluates compliance; it reports, doesn’t fix.','exemption':'Exempts resources instead of fixing them.','assignment update':'Changes the assignment, not the resources.'}}],
out:['{ "name": "inherit-costcenter", "identity": { "type": "SystemAssigned" } }','Remediation backfill-costcenter: ProvisioningState=Accepted, 200 resources to remediate']});

S({id:'move-vm',mode:'complete',lang:'pwsh',domains:['identity','compute'],tags:['move'],file:'move-scheduler.ps1',
title:'Move a VM and its parts to a new resource group',
scenario:'Corvane Rail is consolidating: the scheduler VM in <code>rg-corvane-old</code> moves to <code>rg-corvane-rail</code> in the same subscription. Keep its NIC and OS disk with it.',
learn:[['Move resources to a new resource group',L+'azure/azure-resource-manager/management/move-resource-group-and-subscription'],['Move VMs',L+'azure/azure-resource-manager/management/move-limitations/virtual-machines-move-limitations']],
code:String.raw`$vm   = Get-AzResource -ResourceGroupName rg-corvane-old -Name vm-sched-01
$nic  = Get-AzResource -ResourceGroupName rg-corvane-old -Name vm-sched-01-nic
$disk = Get-AzResource -ResourceGroupName rg-corvane-old -Name vm-sched-01-osdisk

{{1}} -DestinationResourceGroupName "rg-corvane-rail" ~
    -ResourceId {{2}}

# While the move runs: {{3}}`,
b:[{a:'Move-AzResource',o:['Set-AzResource','Copy-AzResource','New-AzResourceGroupDeployment'],why:'<code>Move-AzResource</code> moves existing resources to another group or subscription.',w:{'Set-AzResource':'Updates properties; it can’t change the resource group.','Copy-AzResource':'Not a real cmdlet.','New-AzResourceGroupDeployment':'Deploys a template; it doesn’t move existing resources.'}},
{a:'$vm.ResourceId, $nic.ResourceId, $disk.ResourceId',o:['$vm.ResourceId','$vm.Name, $nic.Name, $disk.Name'],why:'Dependent resources move together in one request.',w:{'$vm.ResourceId':'Leaves the NIC and disk behind; the move validation fails on dependencies.','$vm.Name, $nic.Name, $disk.Name':'-ResourceId needs IDs, not names.'}},
{a:'both groups are locked for writes; resource IDs change; location stays the same',o:['the VM is redeployed to the target group’s region','the VM is deallocated and its public IP changes','only the target group is locked'],why:'Source and target groups are locked (no create, update or delete) during the move. The resources keep their region; their IDs change.',w:{'the VM is redeployed to the target group’s region':'A move never changes the resource’s location.','the VM is deallocated and its public IP changes':'The VM keeps running. Some resources (like Basic public IPs) have their own move limits, but nothing is deallocated.','only the target group is locked':'Both groups are locked.'}}],
out:['Moving 3 resources to rg-corvane-rail …','Microsoft.Compute/virtualMachines/vm-sched-01   → rg-corvane-rail','Microsoft.Network/networkInterfaces/vm-sched-01-nic → rg-corvane-rail','Microsoft.Compute/disks/vm-sched-01-osdisk       → rg-corvane-rail']});

S({id:'rbac-assign-fix',mode:'fix',lang:'azcli',domains:['identity'],tags:['rbac'],file:'onboard-newhire.sh',
title:'Fix it: the team lead can’t grant access',
scenario:'Dana leads the Corvane Rail ops team. She should be able to give new hires <b>Virtual Machine Contributor</b> on <code>rg-corvane-ops</code> herself, with the least privilege possible, and nothing outside that group.',
symptom:'(AuthorizationFailed) The client "dana@corvanerail.example" does not have authorization to perform action "Microsoft.Authorization/roleAssignments/write" over scope "/subscriptions/…".',
learn:[['Assign roles with Azure CLI',L+'azure/role-based-access-control/role-assignments-cli'],['Role Based Access Control Administrator',L+'azure/role-based-access-control/built-in-roles/privileged#role-based-access-control-administrator']],
code:String.raw`# Dana's own role on rg-corvane-ops: {{1}}
az role assignment create \
  --assignee "newhire@corvanerail.example" \
  --role {{2}} \
  --scope {{3}}`,
b:[{a:'Role Based Access Control Administrator',bug:'Contributor',o:['Reader','Virtual Machine Contributor'],why:'Assigning roles needs <code>Microsoft.Authorization/roleAssignments/write</code>. <b>Contributor excludes it.</b> RBAC Administrator (or Owner, or User Access Administrator) has it; RBAC Administrator is the least privilege and can be constrained to specific roles.',w:{'Contributor':'Contributor manages resources but has NotActions on Microsoft.Authorization/*/Write. It can’t assign roles.','Reader':'Read-only. It can’t assign roles.','Virtual Machine Contributor':'Manages VMs only. It can’t assign roles.'}},
{a:'"Virtual Machine Contributor"',o:['"Contributor"','"Owner"'],why:'That is exactly what the new hire needs. (This line was already right.)',w:{'"Contributor"':'Broader than needed.','"Owner"':'Would let the new hire assign roles too.'}},
{a:'"/subscriptions/$SUB/resourceGroups/rg-corvane-ops"',bug:'"/subscriptions/$SUB"',o:['"rg-corvane-ops"'],why:'Dana’s rights only exist on rg-corvane-ops, and the brief says nothing outside it.',w:{'"/subscriptions/$SUB"':'Dana has no rights at subscription scope, and it breaks least privilege.','"rg-corvane-ops"':'Scope needs the full ID.'}}],
out:['{ "principalName": "newhire@corvanerail.example",','  "roleDefinitionName": "Virtual Machine Contributor",','  "scope": "/subscriptions/…/resourceGroups/rg-corvane-ops" }']});

/* ═════════════ STORAGE ═════════════ */
S({id:'adls-acl',mode:'complete',lang:'azcli',domains:['storage','identity'],tags:['hns-acl'],file:'lake-acls.sh',
title:'Data Lake: let analysts read one folder and nothing else',
scenario:'Saltquill Labs builds a data lake. The <code>$ANALYSTS</code> group must <b>read files in raw/2026/</b> (including files added later) and must not list or read anything else in the file system.',
learn:[['Access control lists in Data Lake Storage',L+'azure/storage/blobs/data-lake-storage-access-control'],['Manage ACLs with Azure CLI',L+'azure/storage/blobs/data-lake-storage-acl-cli']],
code:String.raw`az storage account create --name stsaltquilllake --resource-group rg-saltquill-data \
  --sku Standard_ZRS --kind StorageV2 {{1}}

az storage fs create --name raw --account-name stsaltquilllake --auth-mode login

# Root of the file system: analysts may only pass through
az storage fs access set -p / -f raw --account-name stsaltquilllake --auth-mode login \
  --acl "user::rwx,group::r-x,other::---,group:$ANALYSTS:{{2}}"

# raw/2026 and everything under it, now and later
az storage fs access update-recursive -p 2026 -f raw --account-name stsaltquilllake --auth-mode login \
  --acl {{3}}`,
b:[{a:'--hns true',o:['--enable-sftp true','--access-tier Cool','--kind BlobStorage'],why:'ACLs exist only with the <b>hierarchical namespace</b> (Data Lake Storage) enabled.',w:{'--enable-sftp true':'SFTP needs HNS but doesn’t turn it on.','--access-tier Cool':'Tier has nothing to do with ACLs.','--kind BlobStorage':'Legacy kind; use StorageV2 with HNS.'}},
{a:'--x',o:['r-x','rwx','---'],why:'<b>Execute (x) on every parent folder</b> lets them traverse to raw/2026 without listing the root.',w:{'r-x':'r on a directory lets them list the root: more than “nothing else”.','rwx':'Write at the root. Far too much.','---':'Without x they can’t traverse to 2026 at all.'}},
{a:`"group:$ANALYSTS:r-x,default:group:$ANALYSTS:r-x"`,o:[`"group:$ANALYSTS:r--"`,`"default:other::r-x"`,`"group:$ANALYSTS:rwx"`],why:'An <b>access</b> entry for what exists now, plus a <b>default</b> entry so new files and folders inherit it. Directories need x to be traversed.',w:{[`"group:$ANALYSTS:r--"`]:'No default entry (new files miss out) and no x on the subfolders.',[`"default:other::r-x"`]:'Gives everyone (other) read on new items.',[`"group:$ANALYSTS:rwx"`]:'They need read, not write.'}}],
out:['{ "hierarchicalNamespace": true, "kind": "StorageV2" }','{ "acl": "user::rwx,group::r-x,other::---,group:5f2c…:--x" }','{ "successCount": 418, "failureCount": 0 }   (update-recursive)']});

S({id:'sas-policy',mode:'complete',lang:'pwsh',domains:['storage'],tags:['sas'],file:'vendor-sas.ps1',
title:'Revocable SAS for a vendor through a stored access policy',
scenario:'Harrowfen Clinics gives a scanning vendor <b>read and list</b> access to the <code>intake</code> container for 14 days. If the contract ends early, Harrowfen must be able to <b>revoke access without rotating account keys</b>.',
learn:[['Stored access policies',L+'rest/api/storageservices/define-stored-access-policy'],['SAS overview',L+'azure/storage/common/storage-sas-overview']],
code:String.raw`$ctx = (Get-AzStorageAccount -ResourceGroupName rg-harbor -Name stharborscans).Context

{{1}} -Container "intake" -Policy "vendor-read" ~
    -Permission {{2}} -ExpiryTime (Get-Date).AddDays(14) -Context $ctx

$sas = New-AzStorageContainerSASToken -Name "intake" {{3}} -Context $ctx

# Contract ends early: revoke every SAS tied to the policy
{{4}} -Container "intake" -Policy "vendor-read" -Context $ctx`,
b:[{a:'New-AzStorageContainerStoredAccessPolicy',o:['Set-AzStorageContainerAcl','New-AzStorageAccountSASToken','New-AzStorageBlobSASToken'],why:'A stored access policy lives on the container (up to 5 per container) and can back many service SAS tokens.',w:{'Set-AzStorageContainerAcl':'Sets anonymous public access level; not a policy.','New-AzStorageAccountSASToken':'Account SAS can’t reference a stored access policy.','New-AzStorageBlobSASToken':'Issues a SAS; it doesn’t create the policy.'}},
{a:'rl',o:['r','rwdl','racwdl'],why:'r = read, l = list. Exactly what the vendor needs.',w:{'r':'Without l they can’t list blobs in the container.','rwdl':'Adds write and delete.','racwdl':'Adds add, create, write and delete.'}},
{a:'-Policy "vendor-read"',o:['-Permission rl -ExpiryTime (Get-Date).AddDays(14)','-FullUri'],why:'A SAS that references the policy inherits its permissions and expiry, and dies when the policy is removed or changed.',w:{'-Permission rl -ExpiryTime (Get-Date).AddDays(14)':'An ad hoc SAS: the only way to revoke it is to rotate the signing key.','-FullUri':'Only changes the output format.'}},
{a:'Remove-AzStorageContainerStoredAccessPolicy',o:['Revoke-AzStorageAccountUserDelegationKeys','New-AzStorageAccountKey -KeyName key1','Set-AzStorageContainerAcl -Permission Off'],why:'Deleting (or changing) the policy invalidates every service SAS that references it. The change can take up to 30 seconds to apply.',w:{'Revoke-AzStorageAccountUserDelegationKeys':'Only revokes user delegation SAS (signed with Entra credentials).','New-AzStorageAccountKey -KeyName key1':'Works, but breaks everything else using key1. The brief said no key rotation.','Set-AzStorageContainerAcl -Permission Off':'Turns off anonymous access; SAS tokens keep working.'}}],
out:['Policy      Permissions  ExpiryTime','vendor-read rl           2026-12-09 …','?sv=2025-…&si=vendor-read&sr=c&sig=…','Removed stored access policy vendor-read']});

S({id:'ud-sas',mode:'complete',lang:'azcli',domains:['storage','identity'],tags:['sas','mi'],file:'firmware-link.sh',
title:'User delegation SAS: a download link signed by Entra ID',
scenario:'Brindlewick Robotics security bans account-key signing. A build engineer (signed in with Entra ID, holding a blob data role) needs a <b>read-only link</b> to one firmware file for a field tech.',
learn:[['Create a user delegation SAS with Azure CLI',L+'azure/storage/blobs/storage-blob-user-delegation-sas-create-cli']],
code:String.raw`az storage blob generate-sas \
  --account-name stbrindlebuild --container-name artifacts --name firmware-4.2.bin \
  --permissions r --expiry 2026-12-01T00:00Z \
  {{1}} {{2}} --full-uri

# Longest validity allowed for a user delegation SAS: {{3}}`,
b:[{a:'--as-user',o:['--policy-name vendor-read','--account-key "$KEY"'],why:'<code>--as-user</code> signs the SAS with a user delegation key from Entra ID instead of the account key.',w:{'--policy-name vendor-read':'Stored access policies work only with service SAS, not user delegation SAS.','--account-key "$KEY"':'Account-key signing is exactly what security banned.'}},
{a:'--auth-mode login',o:['--auth-mode key','--connection-string "$CONN"'],why:'Use your Entra sign-in to fetch the delegation key.',w:{'--auth-mode key':'Uses the account key.','--connection-string "$CONN"':'Connection strings carry the account key.'}},
{a:'7 days',o:['1 year','30 days','no limit'],why:'A user delegation SAS (and its key) is valid for at most <b>7 days</b>.',w:{'1 year':'User delegation SAS max is 7 days.','30 days':'User delegation SAS max is 7 days.','no limit':'User delegation SAS max is 7 days.'}}],
out:['"https://stbrindlebuild.blob.core.windows.net/artifacts/firmware-4.2.bin?skoid=…&sktid=…&sp=r&sig=…"']});

S({id:'lifecycle',mode:'complete',lang:'azcli',domains:['storage'],tags:['lifecycle','blob-tier'],file:'scans-lifecycle.sh',
title:'Lifecycle rule: Cool at 30, Archive at 180, delete at 7 years',
scenario:'Harrowfen Clinics keeps scans under <code>scans/</code>: move to <b>Cool</b> after 30 days, <b>Archive</b> after 180, delete after 7 years (2,555 days). Old <b>versions</b> must be deleted 90 days after they were created.',
learn:[['Lifecycle management overview',L+'azure/storage/blobs/lifecycle-management-overview'],['Configure a lifecycle policy',L+'azure/storage/blobs/lifecycle-management-policy-configure']],
code:String.raw`cat > policy.json <<'EOF'
{ "rules": [ {
  "enabled": true, "name": "scans-age-out", "type": "Lifecycle",
  "definition": {
    "filters": { "blobTypes": [ {{1}} ], "prefixMatch": [ "scans/" ] },
    "actions": {
      "baseBlob": {
        {{2}}:          { "daysAfterModificationGreaterThan": 30 },
        "tierToArchive": { "daysAfterModificationGreaterThan": {{3}} },
        "delete":        { "daysAfterModificationGreaterThan": 2555 }
      },
      {{4}}: { "delete": { "daysAfterCreationGreaterThan": 90 } }
    } } } ] }
EOF
az storage account management-policy create --account-name sthcscans \
  --resource-group rg-hc --policy @policy.json`,
b:[{a:'"blockBlob"',o:['"pageBlob"','"appendBlob"'],why:'Tiering applies to <b>block blobs</b>.',w:{'"pageBlob"':'Lifecycle management doesn’t support page blobs.','"appendBlob"':'Append blobs only support delete actions, not tiering.'}},
{a:'"tierToCool"',o:['"tierToCold"','"moveToCool"','"coolAfter"'],t:'blob-tier',why:'<code>tierToCool</code> is the action name for the Cool tier.',w:{'"tierToCold"':'Valid action, but that’s the Cold tier; the brief says Cool.','"moveToCool"':'Not a lifecycle action.','"coolAfter"':'Not a lifecycle action.'}},
{a:'180',o:['30','7','2555'],t:'blob-tier',why:'Archive after 180 days, per the brief. Cool has a 30-day early-deletion window, which is satisfied here.',w:{'30':'Same day as the Cool move; the blob would skip Cool.','7':'Archive within a week contradicts the brief.','2555':'That is the delete day.'}},
{a:'"version"',o:['"snapshot"','"previousVersion"','"baseBlob"'],why:'Lifecycle rules have three targets: <code>baseBlob</code>, <code>snapshot</code> and <code>version</code>.',w:{'"snapshot"':'Snapshots are a different feature from versions.','"previousVersion"':'Not a key in the schema.','"baseBlob"':'Already used for the current version.'}}],
out:['{ "policy": { "rules": [ { "name": "scans-age-out", "enabled": true } ] } }','Policy runs once a day; first actions can take up to 24h to appear.']});

S({id:'obj-replication',mode:'fix',lang:'azcli',domains:['storage'],tags:['obj-rep','blob-version'],file:'replicate-catalog.sh',
title:'Fix it: object replication refuses to start',
scenario:'Mossgate Outdoor replicates the <code>catalog</code> container from <code>stmossgtsrc</code> to <code>stmossgtdr</code>, copying blobs created since 1 November.',
symptom:'(InvalidRequest) Object replication requires blob versioning on both accounts and change feed on the source account.',
learn:[['Object replication overview',L+'azure/storage/blobs/object-replication-overview'],['Configure object replication',L+'azure/storage/blobs/object-replication-configure']],
code:String.raw`az storage account blob-service-properties update --account-name stmossgtsrc \
  --resource-group rg-mossgt --enable-versioning true {{1}}

az storage account blob-service-properties update --account-name stmossgtdr \
  --resource-group rg-mossgt {{2}}

az storage account or-policy create --account-name stmossgtdr --resource-group rg-mossgt \
  --source-account stmossgtsrc --destination-account stmossgtdr \
  --source-container catalog --destination-container catalog \
  {{3}}`,
b:[{a:'--enable-change-feed true',bug:'--enable-change-feed false',o:['--enable-last-access-tracking true'],why:'The <b>source</b> needs change feed so replication knows what changed.',w:{'--enable-change-feed false':'Change feed must be ON at the source.','--enable-last-access-tracking true':'For lifecycle rules, not replication.'}},
{a:'--enable-versioning true',bug:'--enable-delete-retention true',o:['--enable-change-feed true'],why:'Versioning is required on <b>both</b> accounts.',w:{'--enable-delete-retention true':'Soft delete is nice, but not the prerequisite.','--enable-change-feed true':'Change feed is only required on the source.'}},
{a:`--min-creation-time '2026-11-01T00:00:00Z'`,o:[`--prefix-match '2026-11'`,'--copy-all true'],why:'Copies only blobs created after that time. (This line was already right.)',w:{[`--prefix-match '2026-11'`]:'Filters by name prefix, not by date.','--copy-all true':'Not a parameter.'}}],
out:['{ "isVersioningEnabled": true, "changeFeed": { "enabled": true } }','{ "isVersioningEnabled": true }','{ "policyId": "a91c…", "rules": [ { "sourceContainer": "catalog" } ] }']});

S({id:'soft-delete',mode:'complete',lang:'azcli',domains:['storage'],tags:['soft-delete'],file:'recovery-net.sh',
title:'Soft delete everything, then undelete a file',
scenario:'Crumbhollow Bakery wants <b>14 days</b> to recover deleted blobs, deleted containers and deleted file shares. On Monday someone deleted <code>menu-2026.docx</code> from the <code>menus</code> blob container.',
learn:[['Blob soft delete',L+'azure/storage/blobs/soft-delete-blob-overview'],['Container soft delete',L+'azure/storage/blobs/soft-delete-container-overview']],
code:String.raw`az storage account blob-service-properties update -n stcrumbrecipes -g rg-crumb \
  --enable-delete-retention true --delete-retention-days {{1}} \
  {{2}} --container-delete-retention-days 14

az storage account file-service-properties update -n stcrumbrecipes -g rg-crumb \
  --enable-delete-retention true --delete-retention-days 14

# Monday morning:
az storage blob {{3}} --account-name stcrumbrecipes --container-name menus \
  --name menu-2026.docx --auth-mode login`,
b:[{a:'14',o:['0','400','366'],why:'Retention is 1–365 days; the brief says 14.',w:{'0':'Minimum is 1 day.','400':'Maximum is 365 days.','366':'Maximum is 365 days.'}},
{a:'--enable-container-delete-retention true',o:['--enable-versioning true','--enable-restore-policy true'],why:'Container soft delete is a separate switch from blob soft delete.',w:{'--enable-versioning true':'Versioning protects overwrites; it doesn’t bring back a deleted container.','--enable-restore-policy true':'Point-in-time restore for block blobs; it doesn’t cover deleted containers.'}},
{a:'undelete',o:['restore','recover','copy start'],why:'<code>az storage blob undelete</code> restores a soft-deleted blob (and its soft-deleted snapshots).',w:{'restore':'Not an az storage blob command.','recover':'Not an az storage blob command.','copy start':'Can’t copy from a deleted blob that hasn’t been undeleted.'}}],
out:['{ "deleteRetentionPolicy": { "days": 14, "enabled": true }, "containerDeleteRetentionPolicy": { "days": 14, "enabled": true } }','{ "shareDeleteRetentionPolicy": { "days": 14, "enabled": true } }','menu-2026.docx undeleted']});

S({id:'files-rbac',mode:'complete',lang:'azcli',domains:['storage','identity'],tags:['files','rbac'],file:'staff-share.sh',
title:'Azure Files share with identity-based access for teachers',
scenario:'Granvale School District maps a <code>staff</code> share on domain-joined Windows laptops. Teachers need to <b>read, write and delete</b> files; they must not change NTFS permissions. Identity-based auth is already enabled on the account.',
learn:[['Assign share-level permissions',L+'azure/storage/files/storage-files-identity-assign-share-level-permissions'],['Azure Files networking (SMB 445)',L+'azure/storage/files/storage-files-networking-overview']],
code:String.raw`az storage share-rm create --storage-account stgranitefiles -g rg-granite \
  --name staff --quota 1024 --enabled-protocols {{1}}

az role assignment create --assignee-object-id $TEACHERS_GROUP \
  --assignee-principal-type Group \
  --role {{2}} \
  --scope "$SA_ID/fileServices/default/fileshares/staff"

# Outbound port the laptops need to reach the share: {{3}}`,
b:[{a:'SMB',o:['NFS'],t:'files',why:'Windows clients with AD identities use SMB.',w:{'NFS':'NFS shares are premium-only and use network-level security, not AD identities.'}},
{a:'"Storage File Data SMB Share Contributor"',o:['"Storage File Data SMB Share Reader"','"Storage File Data SMB Share Elevated Contributor"','"Storage Account Contributor"'],t:'rbac',why:'Contributor = read, write, delete. NTFS ACLs still apply on top of the share-level role.',w:{'"Storage File Data SMB Share Reader"':'Read only.','"Storage File Data SMB Share Elevated Contributor"':'Also lets them change NTFS permissions, which is ruled out.','"Storage Account Contributor"':'Management plane only; grants no file data access over SMB.'}},
{a:'TCP 445',o:['TCP 443','TCP 2049','TCP 3389'],t:'files',why:'SMB uses TCP 445. Many ISPs block it outbound; VPN or ExpressRoute work around that.',w:{'TCP 443':'HTTPS (REST, File Sync). Not SMB mounts.','TCP 2049':'NFS.','TCP 3389':'RDP.'}}],
out:['{ "name": "staff", "enabledProtocols": "SMB", "shareQuota": 1024 }','{ "roleDefinitionName": "Storage File Data SMB Share Contributor" }','PS> Test-NetConnection stgranitefiles.file.core.windows.net -Port 445 → TcpTestSucceeded : True']});

S({id:'azcopy-archive',mode:'fix',lang:'azcli',domains:['storage'],tags:['azcopy'],file:'archive-footage.sh',
title:'Fix it: the footage migration copied nothing',
scenario:'Tallowmere Studios copies the whole <code>raw-footage</code> container into the archive account, landing in the <b>Cool</b> tier. Then they keep local project folders mirrored to the cloud, but cloud copies must <b>never be deleted</b> by the sync.',
symptom:'Job summary: Number of Transfers Completed: 0 … "cannot use directory as source without --recursive or a trailing wildcard (/*)".\nAlso: last night 112 cloud files disappeared after editors cleaned up local folders.',
learn:[['AzCopy copy',L+'azure/storage/common/storage-ref-azcopy-copy'],['AzCopy sync',L+'azure/storage/common/storage-ref-azcopy-sync']],
code:String.raw`azcopy login --tenant-id "$TENANT"

azcopy copy "https://sttallowold.blob.core.windows.net/raw-footage" \
  "https://sttallowarchive.blob.core.windows.net/footage" {{1}} {{2}}

azcopy sync "/mnt/edit-bay/projects" \
  "https://sttallowarchive.blob.core.windows.net/projects" {{3}}`,
b:[{a:'--recursive',bug:'--recursive=false',o:['--include-pattern "*"'],why:'Copying a container or folder requires <code>--recursive</code>.',w:{'--recursive=false':'Containers and folders need --recursive.','--include-pattern "*"':'Filters names; still not recursive.'}},
{a:'--block-blob-tier=Cool',o:['--block-blob-tier=Archive','--blob-type=PageBlob'],why:'Lands blobs directly in Cool. (This line was already right.)',w:{'--block-blob-tier=Archive':'Archive is offline; editors need to read these.','--blob-type=PageBlob':'Page blobs are for VHDs; they can’t be tiered.'}},
{a:'--delete-destination=false',bug:'--delete-destination=true',o:['--delete-destination=prompt'],why:'With <code>true</code>, sync deletes destination files missing from the source. That is what wiped the 112 files.',w:{'--delete-destination=true':'Deletes cloud files that no longer exist locally.','--delete-destination=prompt':'Asks interactively; a nightly job would hang or still delete.'}}],
out:['Job 6e1d… summary','Number of Transfers Completed: 18,204','Final Job Status: Completed','Sync: 37 files uploaded, 0 deleted at destination']});

S({id:'redundancy',mode:'complete',lang:'azcli',domains:['storage'],tags:['redundancy'],file:'tickets-dr.sh',
title:'Read from the secondary, then fail over',
scenario:'Corvane Rail’s ticket archive is <b>GRS</b>. During a regional incident the app must be able to <b>read from the secondary</b> right away. If the primary stays down, ops will <b>promote the secondary</b>.',
learn:[['Storage redundancy',L+'azure/storage/common/storage-redundancy'],['Initiate an account failover',L+'azure/storage/common/storage-initiate-account-failover']],
code:String.raw`az storage account update -n stcorvanetickets -g rg-corvane --sku {{1}}

az storage account show -n stcorvanetickets --query {{2}}

# Primary region still down after the incident review:
az storage account {{3}} -n stcorvanetickets -g rg-corvane`,
b:[{a:'Standard_RAGRS',o:['Standard_GRS','Standard_ZRS','Premium_LRS'],why:'<b>RA-</b>GRS adds a read-only secondary endpoint (<code>-secondary</code>).',w:{'Standard_GRS':'Replicates to the secondary but you can’t read it until a failover.','Standard_ZRS':'No secondary region at all.','Premium_LRS':'One datacenter, no secondary.'}},
{a:'secondaryEndpoints.blob',o:['primaryEndpoints.blob','statusOfPrimary'],why:'Point the app’s read path at the secondary blob endpoint.',w:{'primaryEndpoints.blob':'That is the region that is down.','statusOfPrimary':'Tells you it’s unavailable, not where to read.'}},
{a:'failover',o:['swap','promote','update --failover'],why:'<code>az storage account failover</code> makes the secondary the new primary. Afterwards the account is LRS until you re-enable geo-redundancy.',w:{'swap':'Not a storage command.','promote':'Not a storage command.','update --failover':'Not a parameter.'}}],
out:['{ "sku": { "name": "Standard_RAGRS" } }','"https://stcorvanetickets-secondary.blob.core.windows.net/"','Failover initiated … this can take an hour. Account will be LRS in the new primary.']});

/* ═════════════ COMPUTE ═════════════ */
S({id:'snapshot-restore',mode:'complete',lang:'azcli',domains:['compute'],tags:['snapshot'],file:'pre-patch-snapshot.sh',
title:'Snapshot before patching, rebuild from it after',
scenario:'Orrin &amp; Pell Law snapshots the Ubuntu VM <code>vm-docs-01</code> before patch night. The patch breaks boot. Build <b>a new VM</b> from the snapshot.',
learn:[['Snapshot a managed disk',L+'azure/virtual-machines/snapshot-copy-managed-disk'],['Create a VM from a managed disk',L+'azure/virtual-machines/linux/upload-vhd']],
code:String.raw`OSDISK=$(az vm show -g rg-orrin -n vm-docs-01 --query {{1}} -o tsv)
az snapshot create -g rg-orrin -n snap-docs-prepatch --source "$OSDISK"

# Patch broke boot. A snapshot can't run; turn it into a disk:
az disk create -g rg-orrin -n disk-docs-restored {{2}} snap-docs-prepatch

az vm create -g rg-orrin -n vm-docs-02 \
  {{3}} disk-docs-restored --os-type {{4}}`,
b:[{a:'storageProfile.osDisk.managedDisk.id',o:['storageProfile.osDisk.name','storageProfile.dataDisks[0].managedDisk.id','hardwareProfile.vmSize'],why:'--source takes the disk’s resource ID (a name works only if it’s in the same group).',w:{'storageProfile.osDisk.name':'A bare name; fragile, and not the ID.','storageProfile.dataDisks[0].managedDisk.id':'The first data disk, not the OS disk.','hardwareProfile.vmSize':'The VM size, not a disk.'}},
{a:'--source',o:['--snapshot','--from-snapshot','--copy'],why:'<code>az disk create --source</code> accepts a snapshot (or disk) name or ID.',w:{'--snapshot':'Not a parameter.','--from-snapshot':'Not a parameter.','--copy':'Not a parameter.'}},
{a:'--attach-os-disk',o:['--image','--os-disk-name','--attach-data-disks'],why:'Booting from an existing managed disk uses <code>--attach-os-disk</code>; no image, no admin credentials.',w:{'--image':'Builds a fresh OS from an image.','--os-disk-name':'Names a new OS disk; it doesn’t attach one.','--attach-data-disks':'Attaches data disks only.'}},
{a:'linux',o:['windows','ubuntu'],why:'Required with --attach-os-disk so Azure knows how to treat the disk.',w:{'windows':'The VM is Ubuntu.','ubuntu':'Valid values are linux and windows.'}}],
out:['Snapshot snap-docs-prepatch: Succeeded (full, 30 GiB)','Disk disk-docs-restored: Succeeded','{ "powerState": "VM running", "name": "vm-docs-02" }','Tip: a snapshot is one disk at one moment. Azure Backup is scheduled, retained, application-consistent and restorable to many targets.']});

S({id:'disk-sku',mode:'fix',lang:'azcli',domains:['compute'],tags:['disk-sku'],file:'upgrade-disk.sh',
title:'Fix it: Standard HDD to Premium SSD',
scenario:'Brindlewick Robotics’ render VM <code>vm-render-03</code> (size D4s_v5, which supports Premium storage) is I/O-bound. Convert its OS disk to <b>Premium SSD LRS</b>.',
symptom:'(OperationNotAllowed) Disk vm-render-03-os: changing the SKU requires the VM to be deallocated. Current power state: stopped (allocated).',
learn:[['Convert managed disk types',L+'azure/virtual-machines/disks-convert-types']],
code:String.raw`az vm {{1}} -g rg-brindle -n vm-render-03

az disk update -g rg-brindle -n vm-render-03-os --sku {{2}}

az vm {{3}} -g rg-brindle -n vm-render-03`,
b:[{a:'deallocate',bug:'stop',o:['restart'],why:'Disk type changes need the VM <b>deallocated</b> (off the host). <code>stop</code> powers off but keeps the compute allocated.',w:{'stop':'Stopped (allocated): the disk stays bound to the host, so the SKU can’t change.','restart':'Never takes the VM off the host.'}},
{a:'Premium_LRS',o:['StandardSSD_LRS','UltraSSD_LRS'],why:'Premium SSD, locally redundant. (This line was already right.)',w:{'StandardSSD_LRS':'Standard SSD, not Premium.','UltraSSD_LRS':'Ultra disks can’t be OS disks.'}},
{a:'start',o:['redeploy','reapply'],why:'Start it again. (This line was already right.)',w:{'redeploy':'Moves the VM to a new host; not needed.','reapply':'Re-applies VM state; not needed.'}}],
out:['VM vm-render-03 deallocated','{ "sku": { "name": "Premium_LRS", "tier": "Premium" } }','VM vm-render-03 running']});

S({id:'avset',mode:'complete',lang:'pwsh',domains:['compute'],tags:['avset'],file:'sis-avset.ps1',
title:'Availability set for six web VMs',
scenario:'Granvale’s student information system runs six identical web VMs on managed disks in Canada Central, which offers <b>3 fault domains</b>. Use the maximum fault domains and the <b>default</b> update domain count.',
learn:[['Availability sets overview',L+'azure/virtual-machines/availability-set-overview'],['Create a VM in an availability set',L+'azure/virtual-machines/windows/tutorial-availability-sets']],
code:String.raw`$avs = New-AzAvailabilitySet -ResourceGroupName rg-granite-sis -Name avs-sis-web ~
    -Location canadacentral ~
    -PlatformFaultDomainCount {{1}} ~
    -PlatformUpdateDomainCount {{2}} ~
    -Sku {{3}}

$vmCfg = New-AzVMConfig -VMName vm-sis-web-1 -VMSize Standard_D2s_v5 ~
    {{4}} $avs.Id
# Six VMs over the update domains: VM 6 shares an update domain with VM 1.`,
b:[{a:'3',o:['5','20','1'],why:'Fault domains = separate racks (power and network). Max 3, region-dependent.',w:{'5':'Fault domains top out at 3.','20':'20 is the maximum for update domains, not fault domains.','1':'One rack means no protection.'}},
{a:'5',o:['6','20','3'],why:'Default is <b>5</b> update domains (max 20). With six VMs, the sixth wraps around to UD 0.',w:{'6':'Not the default (the brief says keep the default).','20':'The maximum, not the default.','3':'That is the fault domain count.'}},
{a:'Aligned',o:['Classic','Managed'],why:'<b>Aligned</b> is required for VMs with managed disks.',w:{'Classic':'For unmanaged disks only.','Managed':'Not a valid SKU name.'}},
{a:'-AvailabilitySetId',o:['-Zone','-AvailabilitySetName','-ProximityPlacementGroupId'],why:'A VM joins an availability set <b>at creation</b>, by ID. You can’t add an existing VM later.',w:{'-Zone':'Zones and availability sets are mutually exclusive.','-AvailabilitySetName':'Not a parameter of New-AzVMConfig.','-ProximityPlacementGroupId':'Co-locates VMs; it doesn’t add fault or update domains.'}}],
out:['Name: avs-sis-web   PlatformFaultDomainCount: 3   PlatformUpdateDomainCount: 5   Sku: Aligned','VM vm-sis-web-1 → FD 0 / UD 0 … vm-sis-web-6 → FD 2 / UD 0']});

S({id:'vmss-flex',mode:'complete',lang:'azcli',domains:['compute','networking'],tags:['vmss-flex','lb'],file:'portal-scaleset.sh',
title:'Flexible scale set that heals itself',
scenario:'Harrowfen’s patient portal runs on a scale set across three zones. It must <b>mix regular and Spot VM sizes</b>, and an instance that fails its health probe should be <b>replaced automatically</b> after 30 minutes.',
learn:[['Orchestration modes',L+'azure/virtual-machine-scale-sets/virtual-machine-scale-sets-orchestration-modes'],['Automatic instance repairs',L+'azure/virtual-machine-scale-sets/virtual-machine-scale-sets-automatic-instance-repairs']],
code:String.raw`az vmss create -g rg-harbor-portal -n vmss-portal \
  --image Ubuntu2204 --orchestration-mode {{1}} \
  --instance-count 3 --zones 1 2 3 \
  --load-balancer lb-portal --health-probe probe-http \
  --admin-username harboradmin --generate-ssh-keys

az vmss update -g rg-harbor-portal -n vmss-portal \
  {{2}} --automatic-repairs-grace-period {{3}}`,
b:[{a:'Flexible',o:['Uniform'],t:'vmss-flex',why:'<b>Flexible</b> supports mixing sizes and Spot with standard VMs, and uses regular VM APIs. Uniform is for large fleets of identical instances.',w:{'Uniform':'Uniform instances are identical; no mixing sizes or Spot with regular in one set.'}},
{a:'--enable-automatic-repairs true',o:['--enable-auto-os-upgrade true','--upgrade-policy-mode Rolling'],t:'vmss-flex',why:'Automatic repairs replace (or restart or reimage) instances the health probe or Application Health extension reports unhealthy.',w:{'--enable-auto-os-upgrade true':'Patches the OS image; doesn’t heal broken instances.','--upgrade-policy-mode Rolling':'Controls how model updates roll out.'}},
{a:'30',o:['5','120'],t:'vmss-flex',why:'Grace period is 10–90 minutes (default 30) so new instances can boot before being judged.',w:{'5':'Below the 10-minute minimum.','120':'Above the 90-minute maximum.'}}],
out:['{ "orchestrationMode": "Flexible", "zones": ["1","2","3"] }','{ "automaticRepairsPolicy": { "enabled": true, "gracePeriod": "PT30M" } }']});

S({id:'vmss-cse',mode:'fix',lang:'azcli',domains:['compute'],tags:['cse','vmss-upgrade'],file:'install-nginx.sh',
title:'Fix it: old instances never got nginx',
scenario:'Crumbhollow Bakery’s Linux scale set <code>vmss-orders</code> (Uniform, upgrade policy <b>Manual</b>) gets a Custom Script Extension that installs nginx.',
symptom:'New instances serve the site. The 3 existing instances still return 502: "latestModelApplied": false.',
learn:[['Install apps on a scale set with CLI',L+'azure/virtual-machine-scale-sets/tutorial-install-apps-cli'],['Upgrade policies',L+'azure/virtual-machine-scale-sets/virtual-machine-scale-sets-upgrade-policy']],
code:String.raw`az vmss extension set -g rg-crumb-web --vmss-name vmss-orders \
  --publisher {{1}} --name {{2}} \
  --settings '{"fileUris":["https://stcrumbscripts.blob.core.windows.net/boot/install-nginx.sh"],"commandToExecute":"bash install-nginx.sh"}'

az vmss {{3}} -g rg-crumb-web -n vmss-orders --instance-ids '*'`,
b:[{a:'Microsoft.Azure.Extensions',o:['Microsoft.Compute'],why:'Linux Custom Script publisher. (This line was already right.)',w:{'Microsoft.Compute':'That is the Windows Custom Script publisher.'}},
{a:'CustomScript',o:['CustomScriptExtension'],why:'Linux extension name. (This line was already right.)',w:{'CustomScriptExtension':'Windows extension name.'}},
{a:'update-instances',bug:'restart',o:['reimage','start'],why:'With <b>Manual</b> upgrade policy, the model changes but existing instances keep the old model until you run <code>update-instances</code>.',w:{'restart':'A restart doesn’t apply the new model.','reimage':'Would apply it but wipes the OS disk; heavy-handed.','start':'They’re already running.'}}],
out:['Updating 3 instances to latest model …','{ "latestModelApplied": true } × 3','curl http://lb-orders → 200 OK (nginx)']});

S({id:'autoscale-cli',mode:'complete',lang:'azcli',domains:['compute','monitor'],tags:['autoscale'],file:'shop-autoscale.sh',
title:'Autoscale rules from the CLI',
scenario:'Mossgate Outdoor’s shop scale set: never fewer than <b>2</b>, at most 10. Add 2 when average CPU is over 70% for 5 minutes; remove <b>1</b> when under 30% for 10 minutes.',
learn:[['Autoscale a scale set with CLI',L+'azure/virtual-machine-scale-sets/tutorial-autoscale-cli'],['Autoscale best practices',L+'azure/azure-monitor/autoscale/autoscale-best-practices']],
code:String.raw`az monitor autoscale create -g rg-mossgt-shop --resource vmss-shop \
  --resource-type Microsoft.Compute/virtualMachineScaleSets \
  --name as-shop --min-count {{1}} --max-count 10 --count 2

az monitor autoscale rule create -g rg-mossgt-shop --autoscale-name as-shop \
  --condition {{2}} --scale out 2

az monitor autoscale rule create -g rg-mossgt-shop --autoscale-name as-shop \
  --condition "Percentage CPU < 30 avg 10m" --scale {{3}}`,
b:[{a:'2',o:['0','1'],why:'The minimum is the floor autoscale never goes below.',w:{'0':'Would allow scaling to nothing.','1':'One instance means no redundancy; the brief says 2.'}},
{a:'"Percentage CPU > 70 avg 5m"',o:['"avg Percentage CPU > 70"','"CPU > 70% for 5m"','"Percentage CPU > 70"'],why:'Autoscale condition syntax: <code>METRIC OP THRESHOLD AGGREGATION WINDOW</code>.',w:{'"avg Percentage CPU > 70"':'That’s metric alert syntax, not autoscale.','"CPU > 70% for 5m"':'Wrong metric name and format.','"Percentage CPU > 70"':'Missing aggregation and duration.'}},
{a:'in 1',o:['out -1','down 1','in 2'],why:'<code>--scale in 1</code> removes one instance.',w:{'out -1':'Negative scale-out isn’t valid.','down 1':'Direction is in or out (or to).','in 2':'Brief says remove 1.'}}],
out:['{ "profiles": [ { "capacity": { "minimum": "2", "maximum": "10", "default": "2" } } ] }','Rule: Percentage CPU > 70 (avg, 5m) → +2','Rule: Percentage CPU < 30 (avg, 10m) → −1']});

S({id:'app-slots',mode:'complete',lang:'azcli',domains:['compute'],tags:['app-service'],file:'shop-slots.sh',
title:'Staging slot with a sticky setting, then swap',
scenario:'Tallowmere Studios’ shop needs a <b>staging slot</b> at the lowest tier that supports one. Staging must always talk to the <b>sandbox</b> payment provider, even after a swap.',
learn:[['Deployment slots',L+'azure/app-service/deploy-staging-slots'],['App Service plans',L+'azure/app-service/overview-hosting-plans']],
code:String.raw`az appservice plan create -g rg-tallow-web -n asp-tallow --sku {{1}} --is-linux
az webapp create -g rg-tallow-web -p asp-tallow -n app-tallow-shop --runtime "NODE:20-lts"

az webapp deployment slot create -g rg-tallow-web -n app-tallow-shop --slot staging

az webapp config appsettings set -g rg-tallow-web -n app-tallow-shop --slot staging \
  {{2}} PAYMENTS_MODE=sandbox

az webapp deployment slot swap -g rg-tallow-web -n app-tallow-shop \
  --slot staging --target-slot {{3}}`,
b:[{a:'S1',o:['B1','F1','P1v3'],why:'Deployment slots start at <b>Standard</b>.',w:{'B1':'Basic has no deployment slots.','F1':'Free has no deployment slots.','P1v3':'Works, but not the lowest tier with slots.'}},
{a:'--slot-settings',o:['--settings'],why:'<code>--slot-settings</code> makes the value sticky to the slot, so it doesn’t travel with the swap.',w:{'--settings':'A normal setting swaps with the code, so production would end up in sandbox mode.'}},
{a:'production',o:['main','live','default'],why:'The default slot is named <code>production</code>.',w:{'main':'Not the slot name.','live':'Not the slot name.','default':'Not the slot name.'}}],
out:['Plan asp-tallow: S1 (Standard)','Slot staging created','PAYMENTS_MODE=sandbox (slotSetting: true)','Swap staging → production: completed (warm-up then swap)']});

S({id:'aci-etl',mode:'complete',lang:'azcli',domains:['compute','storage'],tags:['aci','files'],file:'nightly-etl.sh',
title:'Nightly container job that writes to a file share',
scenario:'Saltquill Labs runs a nightly ETL container: it should <b>retry if it crashes</b> but <b>stop once it succeeds</b>, and write results to the <code>etl-output</code> Azure Files share.',
learn:[['Restart policies',L+'azure/container-instances/container-instances-restart-policy'],['Mount Azure Files in ACI',L+'azure/container-instances/container-instances-volume-azure-files']],
code:String.raw`az container create -g rg-saltquill-jobs -n aci-nightly-etl \
  --image stsaltquillacr.azurecr.io/etl:1.4 \
  --os-type {{1}} --cpu 2 --memory 4 \
  --restart-policy {{2}} \
  --azure-file-volume-account-name stsaltquilllake \
  --azure-file-volume-account-key "$SA_KEY" \
  {{3}} \
  --azure-file-volume-mount-path /mnt/output \
  --acr-identity "$ETL_IDENTITY_ID" --assign-identity "$ETL_IDENTITY_ID"`,
b:[{a:'Linux',o:['Windows'],t:'aci',why:'Azure Files volume mounts in ACI are supported for <b>Linux</b> containers only.',w:{'Windows':'ACI can’t mount Azure Files into Windows containers.'}},
{a:'OnFailure',o:['Always','Never'],t:'aci',why:'<b>OnFailure</b> restarts on a non-zero exit only. A clean exit ends the group (and billing).',w:{'Always':'Restarts even after success: the job would loop forever.','Never':'A crash would leave the night’s run unfinished.'}},
{a:'--azure-file-volume-share-name etl-output',o:['--azure-blob-container-name etl-output','--nfs-share etl-output'],t:'files',why:'ACI volumes can be Azure Files shares (also emptyDir, secret, git repo), not blob containers.',w:{'--azure-blob-container-name etl-output':'ACI can’t mount blob containers.','--nfs-share etl-output':'Not a parameter.'}}],
out:['{ "provisioningState": "Succeeded", "restartPolicy": "OnFailure" }','Container etl: Terminated (exit 0) · output written to //stsaltquilllake/etl-output']});

S({id:'aca-telemetry',mode:'complete',lang:'azcli',domains:['compute'],tags:['aca'],file:'telemetry-app.sh',
title:'Container App that scales to zero',
scenario:'Brindlewick Robotics’ telemetry API should be reachable <b>from the internet</b> on port 8080 and cost <b>nothing when idle</b>.',
learn:[['Scaling in Container Apps',L+'azure/container-apps/scale-app'],['Ingress',L+'azure/container-apps/ingress-overview']],
code:String.raw`az containerapp env create -g rg-brindle-api -n cae-brindle --location canadacentral

az containerapp create -g rg-brindle-api -n ca-telemetry \
  --environment {{1}} \
  --image brindleacr.azurecr.io/telemetry:2.0 \
  --ingress {{2}} --target-port 8080 \
  --min-replicas {{3}} --max-replicas 5 \
  --registry-server brindleacr.azurecr.io --registry-identity system`,
b:[{a:'cae-brindle',o:['asp-brindle','aks-brindle'],why:'Container apps run inside a <b>Container Apps environment</b>.',w:{'asp-brindle':'That is an App Service plan.','aks-brindle':'That is an AKS cluster.'}},
{a:'external',o:['internal','public'],why:'<b>external</b> = reachable from the internet.',w:{'internal':'Only reachable inside the environment / VNet.','public':'Not a valid value; use external.'}},
{a:'0',o:['1','-1'],why:'Min replicas 0 lets the app scale to zero; HTTP traffic wakes it.',w:{'1':'Always one replica running, so it’s never free.','-1':'Not valid.'}}],
out:['Environment cae-brindle: Succeeded','Container app ca-telemetry: https://ca-telemetry.<env>.canadacentral.azurecontainerapps.io','Replicas: 0 (idle)']});

S({id:'bicep-sub',mode:'complete',lang:'bicep',domains:['compute','identity'],tags:['bicep'],file:'main.bicep',
title:'Bicep at subscription scope: create the group, then deploy into it',
scenario:'Corvane Rail wants one Bicep file that <b>creates the resource group</b> and deploys the network module into it. Preview the changes before deploying.',
learn:[['Deploy to a subscription with Bicep',L+'azure/azure-resource-manager/bicep/deploy-to-subscription'],['What-if',L+'azure/azure-resource-manager/bicep/deploy-what-if']],
code:String.raw`targetScope = {{1}}

param location string = 'canadacentral'

resource rg 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: 'rg-corvane-signals'
  location: location
}

module net './network.bicep' = {
  name: 'net'
  scope: {{2}}
  params: { location: location }
}

// Preview:  az deployment sub {{3}} --location canadacentral --template-file main.bicep
// Deploy:   az deployment {{4}} create --location canadacentral --template-file main.bicep`,
b:[{a:`'subscription'`,o:[`'resourceGroup'`,`'managementGroup'`,`'tenant'`],why:'Resource groups are created at <b>subscription</b> scope.',w:{[`'resourceGroup'`]:'The default scope. You can’t create a resource group from inside one.',[`'managementGroup'`]:'Wrong level for creating a resource group.',[`'tenant'`]:'Wrong level for creating a resource group.'}},
{a:'rg',o:['resourceGroup()','subscription()'],why:'Point the module at the group you just declared; Bicep adds the dependency for you.',w:{'resourceGroup()':'At subscription scope there is no “current” resource group.','subscription()':'The module deploys resource-group-level resources.'}},
{a:'what-if',o:['validate','show','preview'],why:'<b>what-if</b> lists creates, changes and deletes without deploying.',w:{'validate':'Only checks that the template would be accepted.','show':'Shows an existing deployment.','preview':'Not a command.'}},
{a:'sub',o:['group','mg','tenant'],why:'Subscription-scope templates deploy with <code>az deployment sub</code>.',w:{'group':'Needs an existing resource group, and the template scope must match.','mg':'Management group deployments.','tenant':'Tenant deployments.'}}],
out:['Resource changes: 3 to create.','+ Microsoft.Resources/resourceGroups/rg-corvane-signals','+ Microsoft.Network/virtualNetworks/vnet-signals','ProvisioningState: Succeeded']});

S({id:'arm-copy',mode:'fix',lang:'json',domains:['compute','storage'],tags:['bicep'],file:'lab-accounts.json',
title:'Fix it: the copy loop numbered from zero and ran all at once',
scenario:'Granvale’s ARM template creates four lab storage accounts named <code>stgranitelab1</code> through <code>stgranitelab4</code>, deployed <b>two at a time</b>.',
symptom:'Deployment created stgranitelab0, stgranitelab1, stgranitelab2, stgranitelab3, all four in parallel.',
learn:[['Resource iteration in ARM templates',L+'azure/azure-resource-manager/templates/copy-resources']],
code:String.raw`"resources": [ {
  "type": "Microsoft.Storage/storageAccounts",
  "apiVersion": "2023-05-01",
  "name": "[concat('stgranitelab', {{1}})]",
  "location": "[resourceGroup().location]",
  "sku": { "name": {{2}} },
  "kind": "StorageV2",
  "copy": {
    "name": "labCopy",
    "count": 4,
    "mode": {{3}},
    "batchSize": 2
  }
} ]`,
b:[{a:'copyIndex(1)',bug:'copyIndex()',o:['copy().index'],why:'<code>copyIndex(1)</code> starts counting at 1 instead of 0.',w:{'copyIndex()':'Starts at 0.','copy().index':'Not a template function.'}},
{a:'"Standard_LRS"',o:['"LRS"'],why:'Valid SKU name. (This line was already right.)',w:{'"LRS"':'SKU names are like Standard_LRS.'}},
{a:'"serial"',bug:'"parallel"',o:['"batch"'],why:'batchSize only applies in <b>serial</b> mode.',w:{'"parallel"':'Parallel ignores batchSize and deploys all at once.','"batch"':'Not a mode. The modes are serial and parallel.'}}],
out:['labCopy[0] → stgranitelab1 ✓  labCopy[1] → stgranitelab2 ✓','labCopy[2] → stgranitelab3 ✓  labCopy[3] → stgranitelab4 ✓']});

S({id:'vm-zone-resize',mode:'complete',lang:'azcli',domains:['compute','networking'],tags:['vm'],file:'emr-app-vm.sh',
title:'Zonal VM with no public IP, then resize it',
scenario:'Harrowfen’s EMR app VM goes into <b>zone 2</b>, gets <b>no public IP</b>, and sits behind the subnet’s NSG. A month later it needs <b>twice the vCPUs</b> while keeping its Premium SSD.',
learn:[['Create a VM with Azure CLI',L+'azure/virtual-machines/windows/quick-create-cli'],['Resize a VM',L+'azure/virtual-machines/sizes/resize-vm']],
code:String.raw`az vm create -g rg-harbor-emr -n vm-emr-app1 --image Win2022Datacenter \
  --size Standard_D4s_v5 {{1}} 2 \
  --vnet-name vnet-harbor --subnet snet-app \
  --public-ip-address {{2}} --nsg "" \
  --admin-username harboradmin --admin-password "$ADMIN_PW"

az vm list-vm-resize-options -g rg-harbor-emr -n vm-emr-app1 -o table
az vm resize -g rg-harbor-emr -n vm-emr-app1 --size {{3}}`,
b:[{a:'--zone',o:['--availability-set','--fault-domain'],why:'<code>--zone</code> pins the VM to one availability zone.',w:{'--availability-set':'Expects an availability set name, not a zone number.','--fault-domain':'Not for zone placement.'}},
{a:'""',o:['none','false','disabled'],why:'An empty string means “create no public IP”. Likewise <code>--nsg ""</code> means no NIC-level NSG.',w:{'none':'Would try to create a public IP called “none”.','false':'Not how the CLI turns it off.','disabled':'Not how the CLI turns it off.'}},
{a:'Standard_D8s_v5',o:['Standard_D8_v5','Standard_B2s'],why:'Double the vCPUs, and the <b>s</b> keeps Premium SSD support.',w:{'Standard_D8_v5':'No “s”: no Premium SSD support.','Standard_B2s':'Fewer vCPUs, burstable.'}}],
out:['{ "zones": "2", "publicIpAddress": "", "privateIpAddress": "10.12.1.4" }','Name              NumberOfCores  MemoryInMb','Standard_D8s_v5   8              32768','Resize complete (the VM restarted)']});

/* ═════════════ NETWORKING ═════════════ */
S({id:'hub-spoke',mode:'complete',lang:'azcli',domains:['networking'],tags:['peering','vpn'],file:'hub-spoke.sh',
title:'Hub-and-spoke peering with gateway transit',
scenario:'Corvane Rail’s hub VNet holds the VPN gateway. <code>vnet-spoke1</code> must reach the hub <b>and on-premises through the hub’s gateway</b>.',
learn:[['VNet peering overview',L+'azure/virtual-network/virtual-network-peering-overview'],['Gateway transit',L+'azure/vpn-gateway/vpn-gateway-peering-gateway-transit']],
code:String.raw`az network vnet peering create -g rg-net -n hub-to-spoke1 \
  --vnet-name vnet-hub --remote-vnet vnet-spoke1 \
  --allow-vnet-access {{1}}

az network vnet peering create -g rg-net -n spoke1-to-hub \
  --vnet-name {{2}} --remote-vnet vnet-hub \
  --allow-vnet-access --allow-forwarded-traffic {{3}}

# spoke1 → spoke2 traffic: {{4}}`,
b:[{a:'--allow-gateway-transit',o:['--use-remote-gateways','--allow-forwarded-traffic'],why:'The <b>hub</b> side offers its gateway with <code>--allow-gateway-transit</code>.',w:{'--use-remote-gateways':'That goes on the spoke side.','--allow-forwarded-traffic':'Accepts traffic forwarded by an NVA; doesn’t share the gateway.'}},
{a:'vnet-spoke1',o:['vnet-hub'],why:'A peering is two resources, one on each VNet. This one lives on the spoke.',w:{'vnet-hub':'That would make a second hub-side peering; the spoke still has none, so the status stays Initiated.'}},
{a:'--use-remote-gateways',o:['--allow-gateway-transit'],why:'The <b>spoke</b> uses the hub’s gateway. It can’t have its own gateway at the same time.',w:{'--allow-gateway-transit':'That’s the hub side’s flag.'}},
{a:'needs its own peering, or an NVA in the hub plus UDRs',o:['works through the hub automatically','works once both spokes use remote gateways'],why:'Peering is <b>not transitive</b>. Spoke-to-spoke needs a direct peering, or routing through an NVA or firewall in the hub.',w:{'works through the hub automatically':'Peering is never transitive.','works once both spokes use remote gateways':'Gateway transit gives on-premises reach, not spoke-to-spoke routing.'}}],
out:['hub-to-spoke1  peeringState: Connected  allowGatewayTransit: true','spoke1-to-hub  peeringState: Connected  useRemoteGateways: true','Effective routes (vm in spoke1): 192.168.50.0/24 → VirtualNetworkGateway']});

S({id:'udr-nva',mode:'complete',lang:'azcli',domains:['networking'],tags:['udr'],file:'force-egress.sh',
title:'Force all internet egress through a firewall VM',
scenario:'Crumbhollow Bakery runs a firewall VM (NVA) at <b>10.0.1.4</b> in the hub. Every internet-bound packet from <code>snet-app</code> in spoke1 must go through it.',
learn:[['Virtual network traffic routing',L+'azure/virtual-network/virtual-networks-udr-overview'],['Create a route table',L+'azure/virtual-network/manage-route-table']],
code:String.raw`az network route-table create -g rg-net -n rt-spoke-egress --disable-bgp-route-propagation true

az network route-table route create -g rg-net --route-table-name rt-spoke-egress \
  -n default-via-fw --address-prefix 0.0.0.0/0 \
  --next-hop-type {{1}} --next-hop-ip-address {{2}}

az network vnet subnet update -g rg-net --vnet-name vnet-spoke1 -n snet-app \
  {{3}} rt-spoke-egress

az network nic update -g rg-net -n nic-fw-01 {{4}}`,
b:[{a:'VirtualAppliance',o:['Internet','VirtualNetworkGateway','None'],why:'<b>VirtualAppliance</b> sends traffic to a private IP you specify.',w:{'Internet':'Goes straight out to the internet, bypassing the firewall.','VirtualNetworkGateway':'Sends it to the VPN or ExpressRoute gateway.','None':'Drops the traffic.'}},
{a:'10.0.1.4',o:['10.0.1.0/24','20.48.12.7'],why:'Next hop = the NVA’s <b>private</b> IP.',w:{'10.0.1.0/24':'A prefix, not a next-hop address.','20.48.12.7':'Public IPs can’t be next hops for VirtualAppliance.'}},
{a:'--route-table',o:['--route-table-name','--nsg'],why:'Route tables do nothing until they’re associated with a subnet.',w:{'--route-table-name':'Not a parameter of subnet update.','--nsg':'Wrong resource type.'}},
{a:'--ip-forwarding true',o:['--accelerated-networking true','--private-ip-address 10.0.1.4'],why:'The NVA’s NIC must have <b>IP forwarding</b> on, or Azure drops packets not addressed to it.',w:{'--accelerated-networking true':'Performance only.','--private-ip-address 10.0.1.4':'It already has that IP.'}}],
out:['Route default-via-fw: 0.0.0.0/0 → VirtualAppliance 10.0.1.4','snet-app routeTable: rt-spoke-egress','nic-fw-01 enableIPForwarding: true','Effective route on vm-app-01: 0.0.0.0/0 → 10.0.1.4 (User)']});

S({id:'udr-none',mode:'fix',lang:'azcli',domains:['networking'],tags:['udr','ipflow','peering'],file:'block-legacy.sh',
title:'Fix it: a block rule that cut off the database',
scenario:'Orrin &amp; Pell wanted to block only the retired <code>10.2.9.0/24</code> subnet in a peered VNet. The live database at <b>10.2.4.10</b> (same peered VNet) must stay reachable.',
symptom:'vm-app-01 → 10.2.4.10:1433 times out.\nshow-next-hop: { "nextHopType": "None", "routeTableId": ".../rt-app" }',
learn:[['How Azure selects a route',L+'azure/virtual-network/virtual-networks-udr-overview#how-azure-selects-a-route'],['Next hop',L+'azure/network-watcher/next-hop-overview']],
code:String.raw`az network route-table route create -g rg-net --route-table-name rt-app \
  -n block-legacy --address-prefix {{1}} --next-hop-type {{2}}

az network watcher show-next-hop -g rg-net --vm vm-app-01 \
  --source-ip 10.1.1.4 --dest-ip {{3}}`,
b:[{a:'10.2.9.0/24',bug:'10.2.0.0/16',o:['10.2.4.0/24'],t:'udr',why:'The /16 matched the whole peered VNet, and a user route beats the peering system route for the same prefix. Scope it to the /24.',w:{'10.2.0.0/16':'Covers the database too: the user route with next hop None overrides the peering route.','10.2.4.0/24':'That’s the database subnet. Exactly what must stay open.'}},
{a:'None',o:['VnetLocal','Internet'],t:'udr',why:'<b>None</b> drops the traffic, which is right for the retired subnet. (This line was already right.)',w:{'VnetLocal':'Would route it, not block it.','Internet':'Would send private traffic to the internet.'}},
{a:'10.2.4.10',o:['10.2.9.10'],t:'ipflow',why:'Verify the path to the database: you want <code>VNetPeering</code> as the next hop. (This line was already right.)',w:{'10.2.9.10':'That checks the blocked subnet, not the database.'}}],
out:['Route block-legacy: 10.2.9.0/24 → None','{ "nextHopType": "VNetPeering", "nextHopIpAddress": null }','Longest prefix match: 10.2.4.10 now matches the peering route (10.2.0.0/16), not the /24 block.']});

S({id:'nsg-layers',mode:'fix',lang:'azcli',domains:['networking'],tags:['nsg'],file:'web01-https.sh',
title:'Fix it: HTTPS allowed on the subnet, still blocked',
scenario:'Mossgate Outdoor’s <code>web01</code> has an NSG on its subnet <b>and</b> one on its NIC. Internet users must reach it on <b>443</b>.',
symptom:'Browsers time out on https://web01.\nEffective security rules: nsg-snet-web allow-https (200) ✓ → nsg-nic-web01 deny-all-in (300) ✗',
learn:[['How NSGs filter traffic',L+'azure/virtual-network/network-security-group-how-it-works'],['Security rules',L+'azure/virtual-network/network-security-groups-overview#security-rules']],
code:String.raw`# Subnet NSG (already fine)
az network nsg rule create -g rg-net --nsg-name nsg-snet-web -n allow-https \
  --priority 200 --direction Inbound --access Allow --protocol Tcp \
  --source-address-prefixes Internet --destination-port-ranges 443

# NIC NSG
az network nsg rule create -g rg-net --nsg-name nsg-nic-web01 -n allow-https \
  --priority {{1}} --direction {{2}} --access Allow --protocol Tcp \
  --source-address-prefixes Internet --destination-port-ranges {{3}}

az network nsg rule create -g rg-net --nsg-name nsg-nic-web01 -n deny-all-in \
  --priority 300 --direction Inbound --access Deny --protocol '*' \
  --source-address-prefixes '*' --destination-port-ranges '*'`,
b:[{a:'250',bug:'4000',o:['4097'],why:'Lower number = evaluated first. The allow must come <b>before</b> deny-all-in (300).',w:{'4000':'Evaluated after the deny at 300, so it never matches.','4097':'Out of range (100–4096).'}},
{a:'Inbound',o:['Outbound'],why:'Traffic from the internet to the VM is inbound. (This line was already right.)',w:{'Outbound':'Return traffic is allowed automatically (NSGs are stateful); the problem is inbound.'}},
{a:'443',bug:'80',o:['3389'],why:'HTTPS is 443. For inbound traffic, the subnet NSG is checked first, then the NIC NSG, and <b>both</b> must allow it.',w:{'80':'HTTP, not HTTPS.','3389':'RDP.'}}],
out:['Effective: nsg-snet-web allow-https (200) ✓','Effective: nsg-nic-web01 allow-https (250) ✓','curl -I https://web01 → HTTP/1.1 200 OK']});

S({id:'pe-storage',mode:'complete',lang:'azcli',domains:['networking','storage'],tags:['private-endpoint','private-dns'],file:'records-private.sh',
title:'Private endpoint for blob storage with working DNS',
scenario:'Harrowfen’s records account must be reachable <b>only by a private IP</b> in <code>vnet-harbor</code>, with the normal <code>stharborrecords.blob.core.windows.net</code> name resolving to that IP. Public network access is then turned off.',
learn:[['Private endpoint DNS',L+'azure/private-link/private-endpoint-dns'],['Private endpoints for storage',L+'azure/storage/common/storage-private-endpoints']],
code:String.raw`SA_ID=$(az storage account show -g rg-harbor -n stharborrecords --query id -o tsv)

az network private-endpoint create -g rg-harbor -n pe-records-blob \
  --vnet-name vnet-harbor --subnet snet-pe \
  --private-connection-resource-id "$SA_ID" --group-id {{1}} \
  --connection-name records-blob

az network private-dns zone create -g rg-harbor -n {{2}}

az network private-dns link vnet create -g rg-harbor \
  -z privatelink.blob.core.windows.net -n link-harbor \
  -v vnet-harbor --registration-enabled {{3}}

az network private-endpoint dns-zone-group create -g rg-harbor \
  --endpoint-name pe-records-blob -n default \
  --private-dns-zone privatelink.blob.core.windows.net --zone-name blob

az storage account update -g rg-harbor -n stharborrecords {{4}}`,
b:[{a:'blob',o:['file','Microsoft.Storage','storage'],t:'private-endpoint',why:'The group ID (sub-resource) picks the service: blob, file, queue, table, dfs, web. Each needs its own endpoint.',w:{'file':'That’s Azure Files.','Microsoft.Storage':'That’s the service endpoint name, not a private endpoint group ID.','storage':'Not a valid sub-resource.'}},
{a:'privatelink.blob.core.windows.net',o:['blob.core.windows.net','privatelink.storage.azure.net'],t:'private-dns',why:'The public name CNAMEs to <code>privatelink.blob…</code>; this private zone answers that with the endpoint IP.',w:{'blob.core.windows.net':'Hosting the public zone privately would break every other storage account’s name.','privatelink.storage.azure.net':'Not the zone storage blobs use.'}},
{a:'false',o:['true'],t:'private-dns',why:'Auto-registration is for VM records. The zone group writes the endpoint’s A record. A VNet can have only one auto-registration zone.',w:{'true':'Not needed here, and it would use up the VNet’s single auto-registration link.'}},
{a:'--public-network-access Disabled',o:['--default-action Allow','--https-only true'],t:'private-endpoint',why:'Closes the public endpoint; private endpoints keep working.',w:{'--default-action Allow':'Opens the firewall to everyone.','--https-only true':'Good practice, but the public endpoint stays open.'}}],
out:['Private endpoint pe-records-blob: 10.20.5.4','Zone group default: A stharborrecords → 10.20.5.4','nslookup stharborrecords.blob.core.windows.net → stharborrecords.privatelink.blob.core.windows.net → 10.20.5.4']});

S({id:'svc-endpoint',mode:'fix',lang:'azcli',domains:['networking','storage'],tags:['svc-endpoint'],file:'erp-storage-firewall.sh',
title:'Fix it: storage firewall that let everyone in',
scenario:'Mossgate Outdoor’s ERP subnet must be the <b>only network</b> that reaches <code>stmossgterp</code>, apart from Azure Backup (a trusted Microsoft service).',
symptom:'network-rule add: Subnet snet-erp does not have service endpoint Microsoft.Storage enabled.\nSecurity scan: stmossgterp still reachable from the internet.',
learn:[['Service endpoints',L+'azure/virtual-network/virtual-network-service-endpoints-overview'],['Storage network security',L+'azure/storage/common/storage-network-security']],
code:String.raw`az network vnet subnet update -g rg-mossgt --vnet-name vnet-mossgt -n snet-erp \
  --service-endpoints {{1}}

az storage account network-rule add -g rg-mossgt --account-name stmossgterp \
  --vnet-name vnet-mossgt --subnet snet-erp

az storage account update -g rg-mossgt -n stmossgterp \
  --default-action {{2}} --bypass {{3}}`,
b:[{a:'Microsoft.Storage',bug:'Microsoft.Sql',o:['Microsoft.Web'],why:'The subnet needs the <b>Microsoft.Storage</b> endpoint before a storage network rule can reference it.',w:{'Microsoft.Sql':'That’s for Azure SQL.','Microsoft.Web':'That’s for App Service.'}},
{a:'Deny',bug:'Allow',o:['Block'],why:'With <code>Allow</code>, network rules are just a list; everything still gets in. <b>Deny</b> enforces them.',w:{'Allow':'The firewall isn’t enforced.','Block':'Valid values are Allow and Deny.'}},
{a:'AzureServices',o:['None','Logging'],why:'Lets trusted Microsoft services (like Azure Backup) through. (This line was already right.)',w:{'None':'Would block Azure Backup.','Logging':'Only lets storage analytics logs through.'}}],
out:['snet-erp serviceEndpoints: [ Microsoft.Storage ]','networkRuleSet: defaultAction Deny, bypass AzureServices, 1 virtual network rule','Traffic now comes from 10.30.4.x (private) to the storage public endpoint; the account keeps its public IP.']});

S({id:'private-dns',mode:'complete',lang:'pwsh',domains:['networking'],tags:['private-dns'],file:'corp-zone.ps1',
title:'Private DNS zone: auto-register the hub, resolve from the spoke',
scenario:'Corvane Rail creates <code>corp.corvane.internal</code>. VMs in the <b>hub</b> register themselves automatically; VMs in <b>spoke1</b> only need to <b>resolve</b> names. Add an LDAP record at 10.10.2.15.',
learn:[['Private DNS auto-registration',L+'azure/dns/private-dns-autoregistration'],['Private DNS with PowerShell',L+'azure/dns/private-dns-getstarted-powershell']],
code:String.raw`New-AzPrivateDnsZone -ResourceGroupName rg-net -Name "corp.corvane.internal"

New-AzPrivateDnsVirtualNetworkLink -ResourceGroupName rg-net ~
    -ZoneName "corp.corvane.internal" -Name link-hub ~
    -VirtualNetworkId $hub.Id {{1}}

New-AzPrivateDnsVirtualNetworkLink -ResourceGroupName rg-net ~
    -ZoneName "corp.corvane.internal" -Name link-spoke1 ~
    -VirtualNetworkId $spoke1.Id

New-AzPrivateDnsRecordSet -ResourceGroupName rg-net -ZoneName "corp.corvane.internal" ~
    -Name "ldap" -RecordType {{2}} -Ttl 300 ~
    -PrivateDnsRecords (New-AzPrivateDnsRecordConfig {{3}} "10.10.2.15")`,
b:[{a:'-EnableRegistration',o:['-RegistrationEnabled','-AutoRegister'],why:'A link with <code>-EnableRegistration</code> auto-registers VM A records. The spoke link without it is resolution-only.',w:{'-RegistrationEnabled':'That’s the CLI flag name (--registration-enabled), not the PowerShell parameter.','-AutoRegister':'Not a parameter.'}},
{a:'A',o:['CNAME','PTR','SRV'],why:'Name → IPv4 is an A record.',w:{'CNAME':'Points a name at another name.','PTR':'Reverse lookup (IP → name).','SRV':'Service locator (port + host).'}},
{a:'-Ipv4Address',o:['-Cname','-IPAddress','-Value'],why:'A records take <code>-Ipv4Address</code>.',w:{'-Cname':'For CNAME records.','-IPAddress':'Not the parameter name.','-Value':'Not a parameter.'}}],
out:['Zone corp.corvane.internal: 2 virtual network links (1 registration)','vm-hub-dc01.corp.corvane.internal → 10.10.0.4 (auto-registered)','ldap.corp.corvane.internal → 10.10.2.15']});

S({id:'dns-delegation',mode:'complete',lang:'azcli',domains:['networking'],tags:['dns-deleg'],file:'delegate-labs.sh',
title:'Delegate a child zone to Azure DNS',
scenario:'Brindlewick Robotics hosts <code>brindlerobotics.example</code> in Azure DNS. The R&amp;D team gets its own zone for <b>labs.brindlerobotics.example</b> that they manage separately.',
learn:[['Delegate a subdomain',L+'azure/dns/delegate-subdomain'],['DNS zones and records',L+'azure/dns/dns-zones-records']],
code:String.raw`az network dns zone create -g rg-dns -n {{1}}

NS=$(az network dns zone show -g rg-dns -n labs.brindlerobotics.example \
      --query {{2}} -o tsv)

for ns in $NS; do
  az network dns record-set {{3}} add-record -g rg-dns \
    -z {{4}} -n labs -d "$ns"
done`,
b:[{a:'labs.brindlerobotics.example',o:['labs','brindlerobotics.example/labs'],why:'A child zone is a full zone named with the full domain.',w:{'labs':'That would be a zone for the TLD-like name “labs”.','brindlerobotics.example/labs':'Zone names are DNS names, not paths.'}},
{a:'nameServers',o:['nameServer','soa','numberOfRecordSets'],why:'The child zone’s assigned Azure name servers are what the parent must point to.',w:{'nameServer':'The property is plural: nameServers.','soa':'Start of authority; not the delegation targets.','numberOfRecordSets':'Just a count.'}},
{a:'ns',o:['soa','cname','a'],why:'Delegation = <b>NS</b> records.',w:{'soa':'There’s one per zone; it isn’t delegation.','cname':'An alias; it can’t delegate a zone.','a':'An address record.'}},
{a:'brindlerobotics.example',o:['labs.brindlerobotics.example'],why:'Delegation records live in the <b>parent</b> zone, under the child’s label <code>labs</code>.',w:{'labs.brindlerobotics.example':'The child already has its own NS records at its apex; the parent is what needs pointing.'}}],
out:['Zone labs.brindlerobotics.example: ns1-03.azure-dns.com. ns2-03.azure-dns.net. …','Parent brindlerobotics.example: NS labs → 4 name servers','nslookup -type=NS labs.brindlerobotics.example → ns1-03.azure-dns.com …']});

S({id:'lb-standard',mode:'complete',lang:'azcli',domains:['networking','compute'],tags:['lb','nsg'],file:'orders-lb.sh',
title:'Zone-redundant Standard Load Balancer',
scenario:'Crumbhollow Bakery publishes its orders web tier on port 80 through a <b>zone-redundant public</b> load balancer, sending traffic only to instances whose <code>/healthz</code> returns 200.',
learn:[['Create a public Standard load balancer with CLI',L+'azure/load-balancer/quickstart-load-balancer-standard-public-cli'],['Health probes',L+'azure/load-balancer/load-balancer-custom-probe-overview']],
code:String.raw`az network public-ip create -g rg-crumb -n pip-lb-orders --sku {{1}} --zone 1 2 3

az network lb create -g rg-crumb -n lb-orders --sku Standard \
  --public-ip-address pip-lb-orders --frontend-ip-name fe-orders --backend-pool-name be-orders

az network lb probe create -g rg-crumb --lb-name lb-orders -n probe-health \
  --protocol {{2}} --port 80 --path /healthz

az network lb rule create -g rg-crumb --lb-name lb-orders -n rule-http \
  --protocol Tcp --frontend-port 80 --backend-port 80 \
  --frontend-ip-name fe-orders --backend-pool-name be-orders --probe-name {{3}}

# Backends still unreachable? A Standard LB is {{4}}`,
b:[{a:'Standard',o:['Basic'],t:'lb',why:'Standard LB needs a Standard public IP. Basic SKUs are retired and can’t be zone-redundant.',w:{'Basic':'Basic public IPs are retired and can’t pair with a Standard LB.'}},
{a:'Http',o:['Tcp','Icmp'],t:'lb',why:'A path check needs an Http or Https probe.',w:{'Tcp':'Only checks the port opens; it can’t check /healthz.','Icmp':'Not a probe protocol.'}},
{a:'probe-health',o:['fe-orders','be-orders'],t:'lb',why:'The rule sends traffic only to backends that pass this probe.',w:{'fe-orders':'That’s the frontend IP config.','be-orders':'That’s the backend pool.'}},
{a:'secure by default: an NSG must allow the traffic',o:['open by default to the internet','reachable only from inside the VNet'],t:'nsg',why:'Standard LB and Standard public IPs are closed to inbound traffic until an NSG allows it.',w:{'open by default to the internet':'That was Basic. Standard is closed by default.','reachable only from inside the VNet':'It’s public. It’s just closed until an NSG opens it.'}}],
out:['pip-lb-orders: Standard, zones [1,2,3]','probe-health: Http :80 /healthz','rule-http: 80 → 80 via probe-health','curl http://<frontend IP> → 200 OK (after NSG allow-80)']});

S({id:'vpn-s2s',mode:'complete',lang:'azcli',domains:['networking'],tags:['vpn'],file:'plant-vpn.sh',
title:'Site-to-site VPN to the plant',
scenario:'Brindlewick Robotics connects its factory (LAN <code>192.168.50.0/24</code>, VPN device public IP <b>203.0.113.40</b>) to the hub VNet over IPsec.',
learn:[['Site-to-site VPN with CLI',L+'azure/vpn-gateway/vpn-gateway-howto-site-to-site-resource-manager-cli'],['Gateway subnet',L+'azure/vpn-gateway/vpn-gateway-about-vpn-gateway-settings#gwsub']],
code:String.raw`az network vnet subnet create -g rg-net --vnet-name vnet-hub \
  -n {{1}} --address-prefixes 10.0.255.0/27

az network vnet-gateway create -g rg-net -n vgw-hub --vnet vnet-hub \
  --public-ip-addresses pip-vgw --gateway-type Vpn --vpn-type {{2}} \
  --sku VpnGw2AZ --no-wait

az network local-gateway create -g rg-net -n lgw-plant \
  --gateway-ip-address {{3}} --local-address-prefixes 192.168.50.0/24

az network vpn-connection create -g rg-net -n cn-hub-plant \
  --vnet-gateway1 vgw-hub {{4}} lgw-plant --shared-key "$PSK"`,
b:[{a:'GatewaySubnet',o:['snet-gateway','AzureGatewaySubnet','AzureFirewallSubnet'],why:'The name must be exactly <b>GatewaySubnet</b>; /27 or larger is recommended.',w:{'snet-gateway':'Any other name and the gateway can’t deploy.','AzureGatewaySubnet':'Close, but wrong.','AzureFirewallSubnet':'That’s for Azure Firewall.'}},
{a:'RouteBased',o:['PolicyBased'],why:'Route-based is the standard choice and required for VpnGw SKUs.',w:{'PolicyBased':'Basic SKU only, one tunnel, no P2S.'}},
{a:'203.0.113.40',o:['192.168.50.1','10.0.255.4'],why:'The local network gateway represents the on-prem device by its <b>public</b> IP.',w:{'192.168.50.1':'A private LAN address isn’t reachable from Azure.','10.0.255.4':'That’s inside Azure’s gateway subnet.'}},
{a:'--local-gateway2',o:['--vnet-gateway2','--remote-gateway'],why:'S2S connection = VNet gateway ↔ local network gateway.',w:{'--vnet-gateway2':'That’s for VNet-to-VNet connections.','--remote-gateway':'Not a parameter.'}}],
out:['GatewaySubnet 10.0.255.0/27 created','vgw-hub provisioning (this takes 30–45 minutes) …','lgw-plant: 203.0.113.40 · 192.168.50.0/24','cn-hub-plant: connectionStatus Connected']});

S({id:'nat-gw',mode:'complete',lang:'azcli',domains:['networking'],tags:['nat'],file:'egress-ip.sh',
title:'One fixed outbound IP with a NAT gateway',
scenario:'Saltquill Labs’ worker VMs call a partner API that <b>allow-lists one IP</b>. Some workers have instance-level public IPs left over from testing.',
learn:[['NAT gateway overview',L+'azure/nat-gateway/nat-overview'],['Outbound connectivity',L+'azure/load-balancer/load-balancer-outbound-connections']],
code:String.raw`az network public-ip create -g rg-saltquill -n pip-nat --sku Standard --allocation-method {{1}}

az network nat gateway create -g rg-saltquill -n ng-egress \
  --public-ip-addresses pip-nat --idle-timeout 10

az network vnet subnet update -g rg-saltquill --vnet-name vnet-lab -n snet-workers \
  {{2}} ng-egress

# Outbound traffic from snet-workers now leaves via: {{3}}`,
b:[{a:'Static',o:['Dynamic'],why:'Standard public IPs are always static.',w:{'Dynamic':'Standard SKU doesn’t support dynamic allocation.'}},
{a:'--nat-gateway',o:['--route-table','--service-endpoints'],why:'NAT gateway is associated per subnet.',w:{'--route-table':'Routes don’t give a stable source IP.','--service-endpoints':'For Azure PaaS reach, not internet egress.'}},
{a:'the NAT gateway’s IP, even on VMs that still have their own public IP',o:['each VM’s own public IP where one exists','a random Azure IP'],why:'For outbound flows, NAT gateway takes precedence over instance-level public IPs and load balancer outbound rules.',w:{'each VM’s own public IP where one exists':'NAT gateway takes precedence for outbound. The instance IP is still used for inbound.','a random Azure IP':'Default outbound access is what NAT gateway replaces.'}}],
out:['pip-nat: 20.104.7.91 (Static)','snet-workers natGateway: ng-egress','curl ifconfig.me (from any worker) → 20.104.7.91']});

S({id:'nw-diagnose',mode:'complete',lang:'azcli',domains:['networking','monitor'],tags:['ipflow'],file:'diagnose-sis.sh',
title:'Pick the right Network Watcher tool',
scenario:'Granvale has three questions about <code>vm-sis-db</code>: (1) is an NSG blocking RDP from the jump box? (2) where does its internet traffic actually go? (3) keep 30 days of who-talked-to-whom history for the whole VNet.',
learn:[['IP flow verify',L+'azure/network-watcher/ip-flow-verify-overview'],['Next hop',L+'azure/network-watcher/next-hop-overview'],['VNet flow logs',L+'azure/network-watcher/vnet-flow-logs-overview']],
code:String.raw`# (1) Is an NSG blocking RDP from 10.30.0.4?
az network watcher {{1}} -g rg-granite --vm vm-sis-db \
  --direction Inbound --protocol TCP --local 10.30.2.5:3389 --remote 10.30.0.4:50000

# (2) Where does traffic to the internet go?
az network watcher {{2}} -g rg-granite --vm vm-sis-db \
  --source-ip 10.30.2.5 --dest-ip 8.8.8.8

# (3) Who talked to whom, 30 days
az network watcher flow-log create -g rg-granite --location canadacentral -n fl-vnet-sis \
  {{3}} vnet-sis --storage-account stgranitelogs --retention 30`,
b:[{a:'test-ip-flow',o:['show-next-hop','test-connectivity'],why:'<b>IP flow verify</b> answers “allowed or denied, and by which NSG rule” for one 5-tuple.',w:{'show-next-hop':'Shows routing, not NSG decisions.','test-connectivity':'Tests an end-to-end connection; heavier, and less specific about the rule.'}},
{a:'show-next-hop',o:['test-ip-flow','packet-capture create'],why:'<b>Next hop</b> shows the route actually chosen (Internet, VirtualAppliance, None, …).',w:{'test-ip-flow':'Shows NSG allow or deny, not the route.','packet-capture create':'Captures packets; overkill for routing.'}},
{a:'--vnet',o:['--nsg'],why:'<b>VNet flow logs</b> cover the whole VNet. New NSG flow logs can no longer be created (blocked since June 2025; retiring 2027).',w:{'--nsg':'NSG flow logs are being retired; new ones can’t be created.'}}],
out:['{ "access": "Deny", "ruleName": "securityRules/deny-rdp-from-jump" }','{ "nextHopType": "VirtualAppliance", "nextHopIpAddress": "10.30.0.68" }','Flow log fl-vnet-sis: enabled, retention 30 days']});

/* ═════════════ MONITOR & MAINTAIN ═════════════ */
S({id:'diag-blob',mode:'complete',lang:'azcli',domains:['monitor','storage'],tags:['diag'],file:'blob-diagnostics.sh',
title:'Send blob delete logs to Log Analytics',
scenario:'Crumbhollow Bakery wants to <b>query who deleted blobs</b> in <code>stcrumbrecipes</code> using KQL in the <code>law-ops</code> workspace.',
learn:[['Diagnostic settings',L+'azure/azure-monitor/data-collection/diagnostic-settings'],['Monitor Blob Storage',L+'azure/storage/blobs/monitor-blob-storage']],
code:String.raw`WS=$(az monitor log-analytics workspace show -g rg-ops -n law-ops --query id -o tsv)
SA_ID=$(az storage account show -g rg-crumb -n stcrumbrecipes --query id -o tsv)

az monitor diagnostic-settings create -n blob-to-law \
  --resource "$SA_ID/{{1}}" \
  {{2}} "$WS" \
  --logs '[{"category":{{3}},"enabled":true},{"category":"StorageWrite","enabled":true}]'`,
b:[{a:'blobServices/default',o:['blobs','containers/default'],why:'Storage resource logs are configured per <b>service</b> (blob, file, queue, table), not on the account itself.',w:{'blobs':'Not a valid sub-resource path.','containers/default':'Not a valid sub-resource path.'}},
{a:'--workspace',o:['--storage-account','--event-hub'],why:'Logs must land in a Log Analytics workspace for KQL queries.',w:{'--storage-account':'Archives logs as files: cheap to keep, but you can’t query them with KQL.','--event-hub':'Streams to SIEMs and other tools.'}},
{a:'"StorageDelete"',o:['"AuditEvent"','"Transaction"','"StorageRead"'],why:'Storage log categories are StorageRead, StorageWrite and StorageDelete.',w:{'"AuditEvent"':'That’s Key Vault’s category.','"Transaction"':'A metric category, not a log.','"StorageRead"':'Reads, not deletes.'}}],
out:['{ "name": "blob-to-law", "logs": [ StorageDelete ✓, StorageWrite ✓ ] }','Table StorageBlobLogs will populate within minutes.']});

S({id:'kql-heartbeat',mode:'complete',lang:'kql',domains:['monitor','compute'],tags:['kql','ama'],file:'silent-machines.kql',
title:'KQL: which machines went silent?',
scenario:'Granvale wants a list of machines whose agent hasn’t sent a heartbeat for more than <b>15 minutes</b>, looking back over the last day, <b>quietest first</b>.',
learn:[['Log queries overview',L+'azure/azure-monitor/logs/log-query-overview'],['summarize operator',L+'kusto/query/summarize-operator']],
code:String.raw`Heartbeat
| where TimeGenerated > {{1}}
| summarize LastBeat = {{2}}(TimeGenerated) by Computer
| where LastBeat < ago(15m)
| order by LastBeat {{3}}`,
b:[{a:'ago(1d)',o:['ago(-1d)','"1d"','datetime(1d)'],why:'<code>ago(1d)</code> = now minus one day.',w:{'ago(-1d)':'A negative timespan points one day into the future, so nothing matches.','"1d"':'A string, not a datetime.','datetime(1d)':'datetime() expects a date literal.'}},
{a:'max',o:['min','count','avg'],why:'The <b>latest</b> heartbeat per computer is max(TimeGenerated).',w:{'min':'That’s the earliest heartbeat.','count':'Number of beats, not when.','avg':'Average time isn’t meaningful here.'}},
{a:'asc',o:['desc','ascending'],why:'Oldest last-beat first = <b>asc</b>. (Default order is desc.)',w:{'desc':'Newest first, so the quietest machine ends up at the bottom.','ascending':'KQL uses asc and desc.'}}],
out:['Computer          LastBeat','vm-sis-db         2026-11-25 03:12','vm-sis-web-4      2026-11-25 05:47']});

S({id:'kql-activity',mode:'complete',lang:'kql',domains:['monitor','identity'],tags:['kql','alerts'],file:'who-deleted.kql',
title:'KQL: who deleted the VM?',
scenario:'A VM vanished from Orrin &amp; Pell’s subscription. The Activity log is exported to Log Analytics. Find <b>who</b> successfully deleted it, and when.',
learn:[['AzureActivity table',L+'azure/azure-monitor/reference/tables/azureactivity'],['Activity log',L+'azure/azure-monitor/essentials/activity-log']],
code:String.raw`AzureActivity
| where OperationNameValue == {{1}}
| where ActivityStatusValue == {{2}}
| project TimeGenerated, {{3}}, ResourceGroup, _ResourceId`,
b:[{a:'"MICROSOFT.COMPUTE/VIRTUALMACHINES/DELETE"',o:['"Delete Virtual Machine"','"Microsoft.Compute/virtualMachines/write"'],why:'OperationNameValue holds the operation in upper case; == is case-sensitive (=~ isn’t).',w:{'"Delete Virtual Machine"':'That’s the display name, not OperationNameValue.','"Microsoft.Compute/virtualMachines/write"':'Create or update, not delete.'}},
{a:'"Success"',o:['"Succeeded"','"Accept"'],why:'Delete operations log Start/Accept and then Success (or Failure).',w:{'"Succeeded"':'That’s provisioning state wording, not activity status.','"Accept"':'Accepted ≠ done.'}},
{a:'Caller',o:['CallerIpAddress','Authorization'],why:'<b>Caller</b> is the UPN or app ID that did it.',w:{'CallerIpAddress':'Where from, not who.','Authorization':'The RBAC context, not the identity.'}}],
out:['TimeGenerated         Caller                       ResourceGroup','2026-11-24 22:41      it-temp@orrinpike.example  RG-ORRIN']});

S({id:'alerts-stack',mode:'complete',lang:'azcli',domains:['monitor'],tags:['alerts','autoscale'],file:'oncall-alerts.sh',
title:'Action group + metric alert + activity log alert',
scenario:'Granvale on-call gets an email when <code>vm-sis-db</code> averages <b>over 85% CPU</b>, and when <b>any VM in the subscription is deleted</b>.',
learn:[['Action groups',L+'azure/azure-monitor/alerts/action-groups'],['Create a metric alert with CLI',L+'azure/azure-monitor/alerts/azure-cli-metrics-alert-sample'],['Activity log alerts',L+'azure/azure-monitor/alerts/activity-log-alerts']],
code:String.raw`az monitor action-group create -g rg-ops -n ag-oncall --short-name {{1}} \
  --action email oncall oncall@granvale.example

az monitor metrics alert create -g rg-ops -n cpu-high --scopes "$VM_ID" \
  --condition {{2}} --window-size 5m --evaluation-frequency 1m \
  --action ag-oncall --severity 2

az monitor activity-log alert create -g rg-ops -n vm-deleted \
  --scope "/subscriptions/$SUB" \
  --condition {{3}} \
  --action-group ag-oncall`,
b:[{a:'oncall',o:['granite-oncall-team','""'],t:'alerts',why:'Short name: up to <b>12 characters</b>, shown in SMS and email.',w:{'granite-oncall-team':'19 characters; the max is 12.','""':'Short name is required.'}},
{a:'"avg Percentage CPU > 85"',o:['"Percentage CPU > 85 avg 5m"','"CPU > 85%"'],t:'alerts',why:'Metric alert syntax: <code>AGGREGATION METRIC OP THRESHOLD</code>; the window is set separately.',w:{'"Percentage CPU > 85 avg 5m"':'That’s autoscale syntax.','"CPU > 85%"':'Wrong metric name and format.'}},
{a:'"category=Administrative and operationName=Microsoft.Compute/virtualMachines/delete"',o:['"category=ServiceHealth"','"avg Percentage CPU > 0"'],t:'alerts',why:'Deletes are Administrative activity-log events; filter on the operation.',w:{'"category=ServiceHealth"':'Azure platform incidents, not your deletes.','"avg Percentage CPU > 0"':'Metric syntax; activity log alerts filter on event fields.'}}],
out:['ag-oncall: email oncall@…','cpu-high: avg Percentage CPU > 85 (5m window, every 1m) → ag-oncall','vm-deleted: Administrative / …/virtualMachines/delete → ag-oncall']});

S({id:'ama-dcr',mode:'complete',lang:'azcli',domains:['monitor','compute'],tags:['ama'],file:'emr-monitoring.sh',
title:'Azure Monitor Agent + a data collection rule',
scenario:'Harrowfen’s Windows Server 2022 VM <code>vm-emr-app1</code> must send its event logs and performance counters to Log Analytics, using the current agent.',
learn:[['Manage Azure Monitor Agent',L+'azure/azure-monitor/agents/azure-monitor-agent-manage'],['Data collection rules',L+'azure/azure-monitor/data-collection/data-collection-rule-overview']],
code:String.raw`az vm extension set -g rg-harbor-emr --vm-name vm-emr-app1 \
  --name {{1}} --publisher Microsoft.Azure.Monitor --enable-auto-upgrade true

az monitor data-collection rule association create --name dcra-emr-app1 \
  --rule-id "$DCR_ID" --resource {{2}}

# The agent collects only what a {{3}} tells it to.`,
b:[{a:'AzureMonitorWindowsAgent',o:['AzureMonitorLinuxAgent','MicrosoftMonitoringAgent'],why:'Windows VM → <b>AzureMonitorWindowsAgent</b>.',w:{'AzureMonitorLinuxAgent':'For Linux VMs.','MicrosoftMonitoringAgent':'The legacy Log Analytics agent (MMA), retired in August 2024.'}},
{a:'"$VM_ID"',o:['"$WS_ID"','"$DCR_ID"'],why:'The association links the rule to the <b>machine</b> it collects from.',w:{'"$WS_ID"':'The workspace is the destination defined inside the DCR.','"$DCR_ID"':'Already passed as --rule-id.'}},
{a:'data collection rule (DCR)',o:['diagnostic setting','action group'],why:'AMA has no local config; <b>DCRs</b> define what to collect and where to send it.',w:{'diagnostic setting':'Diagnostic settings route platform logs and metrics, not guest OS data.','action group':'Alert notifications.'}}],
out:['Extension AzureMonitorWindowsAgent: Succeeded','DCR association dcra-emr-app1 → vm-emr-app1','Event and Perf tables populating in law-ops']});

S({id:'backup-crr',mode:'complete',lang:'azcli',domains:['monitor','compute'],tags:['restore','vault'],file:'dr-restore.sh',
title:'Cross Region Restore of a VM’s disks',
scenario:'Orrin &amp; Pell wants to restore VM backups <b>in the paired region</b> during a regional outage. Set up the vault correctly, then run the restore.',
learn:[['Cross Region Restore',L+'azure/backup/backup-create-recovery-services-vault#set-cross-region-restore'],['Restore VM disks with CLI',L+'azure/backup/tutorial-restore-disk']],
code:String.raw`az backup vault create -g rg-orrin-bk -n rsv-orrin --location canadacentral

# Change storage redundancy {{1}} the first item is protected
az backup vault backup-properties set -g rg-orrin-bk -n rsv-orrin \
  --backup-storage-redundancy {{2}} --cross-region-restore-flag true

az backup restore {{3}} -g rg-orrin-bk --vault-name rsv-orrin \
  --container-name vm-docs-01 --item-name vm-docs-01 --rp-name "$RP" \
  --storage-account "$STAGING_SA_CE" --target-resource-group rg-orrin-dr \
  {{4}}`,
b:[{a:'before',o:['after','any time after'],t:'vault',why:'Redundancy is locked once items are protected; set it <b>before</b> the first backup.',w:{'after':'Too late: it can’t change once backups exist.','any time after':'It’s locked once items are protected.'}},
{a:'GeoRedundant',o:['LocallyRedundant','ZoneRedundant'],t:'vault',why:'Cross Region Restore needs <b>GRS</b>; backups replicate to the paired region.',w:{'LocallyRedundant':'No copy in another region.','ZoneRedundant':'Zones in one region; no paired-region copy.'}},
{a:'restore-disks',o:['restore-files','restore-azurewl'],t:'restore',why:'Restore the managed disks, then create the VM (or deploy the template the vault generates).',w:{'restore-files':'There is no restore-files command; file-level recovery is under “az backup restore files”.','restore-azurewl':'For SQL or SAP HANA in VMs.'}},
{a:'--use-secondary-region',o:['--target-zone 2','--restore-mode AlternateLocation'],t:'restore',why:'Runs the restore from the replicated secondary copy.',w:{'--target-zone 2':'Cross-zone restore in the same region.','--restore-mode AlternateLocation':'Chooses original vs alternate location; it doesn’t switch to the secondary region’s copy.'}}],
out:['Vault rsv-orrin: storageModelType GeoRedundant, crossRegionRestore true','Job 3f2a… (CrossRegionRestore) InProgress → Completed','Disks restored in Canada East, template generated for VM creation']});

S({id:'backup-enhanced',mode:'complete',lang:'pwsh',domains:['monitor','compute'],tags:['backup-policy','vault'],file:'pol-4h.ps1',
title:'Back up a VM every 4 hours (Enhanced policy)',
scenario:'Brindlewick Robotics’ build server changes all day. They want a VM backup <b>every 4 hours</b>.',
learn:[['Enhanced policy for VM backup',L+'azure/backup/backup-azure-vms-enhanced-policy']],
code:String.raw`$vault = Get-AzRecoveryServicesVault -ResourceGroupName rg-brindle-bk -Name rsv-brindle

$sch = Get-AzRecoveryServicesBackupSchedulePolicyObject -WorkloadType AzureVM ~
    -BackupManagementType AzureVM -PolicySubType {{1}} -ScheduleRunFrequency {{2}}
$sch.HourlySchedule.Interval = {{3}}

$ret = Get-AzRecoveryServicesBackupRetentionPolicyObject -WorkloadType AzureVM ~
    -BackupManagementType AzureVM -ScheduleRunFrequency Hourly

New-AzRecoveryServicesBackupProtectionPolicy -Name "pol-4h" -WorkloadType AzureVM ~
    -BackupManagementType AzureVM -SchedulePolicy $sch -RetentionPolicy $ret -VaultId $vault.ID`,
b:[{a:'Enhanced',o:['Standard'],why:'Multiple backups per day need the <b>Enhanced</b> policy (it also supports Trusted Launch and more).',w:{'Standard':'Standard VM policy is once a day at most.'}},
{a:'Hourly',o:['Daily','Weekly'],why:'The hourly schedule is what allows intervals within a day.',w:{'Daily':'Once a day.','Weekly':'Once a week.'}},
{a:'4',o:['3','2','1'],why:'Enhanced intervals are 4, 6, 8 or 12 hours.',w:{'3':'Not a supported interval (4, 6, 8, 12).','2':'Not a supported interval (4, 6, 8, 12).','1':'Not a supported interval (4, 6, 8, 12).'}}],
out:['Name    WorkloadType  PolicySubType  ScheduleRunFrequency','pol-4h  AzureVM       Enhanced       Hourly (every 4h)']});

S({id:'file-recovery',mode:'complete',lang:'azcli',domains:['monitor'],tags:['file-recovery'],file:'restore-menu-db.sh',
title:'Pull one file out of a VM backup',
scenario:'Crumbhollow Bakery’s point-of-sale VM <code>vm-pos-01</code> lost <code>menu.db</code>. Restore just that file from last night’s recovery point, without restoring the whole VM.',
learn:[['Restore files from a VM backup with CLI',L+'azure/backup/tutorial-restore-files'],['File recovery',L+'azure/backup/backup-azure-restore-files-from-vm']],
code:String.raw`az backup recoverypoint list -g rg-bk --vault-name rsv-crumb \
  --container-name vm-pos-01 --item-name vm-pos-01 \
  --backup-management-type AzureIaasVM -o table

az backup restore files {{1}} -g rg-bk --vault-name rsv-crumb \
  --container-name vm-pos-01 --item-name vm-pos-01 --rp-name "$RP"

# Run the downloaded script {{2}}, copy menu.db from the mounted volume, then:

az backup restore files {{3}} -g rg-bk --vault-name rsv-crumb \
  --container-name vm-pos-01 --item-name vm-pos-01 --rp-name "$RP"`,
b:[{a:'mount-rp',o:['download','restore-disks'],why:'<code>mount-rp</code> generates a script that mounts the recovery point’s disks as local volumes.',w:{'download':'Not a subcommand.','restore-disks':'Restores whole disks; overkill for one file.'}},
{a:'on vm-pos-01 (or another machine with a compatible OS)',o:['in Azure Cloud Shell','inside the Recovery Services vault'],why:'The script mounts the recovery point over iSCSI on a machine whose OS can read the volumes. The same VM is the usual choice.',w:{'in Azure Cloud Shell':'Cloud Shell can’t mount iSCSI volumes.','inside the Recovery Services vault':'Vaults don’t run scripts.'}},
{a:'unmount-rp',o:['dismount','cleanup'],why:'Unmount when you’re done (it also auto-unmounts after 12 hours).',w:{'dismount':'Not a subcommand.','cleanup':'Not a subcommand.'}}],
out:['Recovery point 2026-11-24 23:00 (AppConsistent)','Script vm-pos-01_…_ILR.ps1 generated (password included)','Volumes F:\\ G:\\ mounted → menu.db copied','Recovery point unmounted']});

/* ═════════════ CROSS-DOMAIN ═════════════ */
S({id:'branch-landing',mode:'complete',lang:'azcli',domains:['networking','identity','storage','compute','monitor'],tags:['lock','svc-endpoint','redundancy','vault','nsg'],file:'yyc-branch.sh',
title:'Branch landing zone: all five domains in one script',
scenario:'Brindlewick Robotics opens a Calgary branch in <b>Canada Central</b>. The resource group must survive accidental deletion. The POS subnet sits inside the branch VNet and reaches storage privately via a service endpoint. Storage must survive a <b>zone</b> outage (no second region needed). The POS VM is backed up nightly.',
learn:[['Resource locks',L+'azure/azure-resource-manager/management/lock-resources'],['Storage redundancy',L+'azure/storage/common/storage-redundancy'],['Back up a VM with CLI',L+'azure/backup/quick-backup-vm-cli']],
code:String.raw`az group create -n rg-brindle-yyc -l canadacentral --tags CostCenter=4410
az lock create -n no-delete -g rg-brindle-yyc --lock-type {{1}}

az network nsg create -g rg-brindle-yyc -n nsg-shop
az network vnet create -g rg-brindle-yyc -n vnet-yyc --address-prefixes 10.60.0.0/16 \
  --subnet-name snet-shop --subnet-prefixes {{2}}
az network vnet subnet update -g rg-brindle-yyc --vnet-name vnet-yyc -n snet-shop \
  --network-security-group nsg-shop --service-endpoints Microsoft.Storage

az storage account create -g rg-brindle-yyc -n stbrindleyyc --sku {{3}} \
  --default-action Deny --kind StorageV2

az vm create -g rg-brindle-yyc -n vm-yyc-pos --image Win2022Datacenter --size Standard_B2ms \
  --vnet-name vnet-yyc --subnet snet-shop --public-ip-address "" --nsg "" \
  --admin-username kadmin --admin-password "$PW"

az backup protection enable-for-vm -g rg-brindle-ops --vault-name {{4}} \
  --vm "$(az vm show -g rg-brindle-yyc -n vm-yyc-pos --query id -o tsv)" \
  --policy-name DefaultPolicy`,
b:[{a:'CanNotDelete',o:['ReadOnly'],t:'lock',why:'Delete protection that still lets the team build inside the group.',w:{'ReadOnly':'Every later command in this script would fail with ScopeLocked.'}},
{a:'10.60.1.0/24',o:['10.61.1.0/24','10.60.0.0/16'],t:'nsg',why:'A subnet must fit inside the VNet’s address space (Azure keeps 5 addresses in each subnet).',w:{'10.61.1.0/24':'Outside 10.60.0.0/16.','10.60.0.0/16':'The whole VNet, leaving no room for other subnets.'}},
{a:'Standard_ZRS',o:['Standard_LRS','Standard_GRS'],t:'redundancy',why:'<b>ZRS</b> = three zones in one region. Survives a zone outage without paying for a second region.',w:{'Standard_LRS':'One datacenter; a zone outage takes it down.','Standard_GRS':'LRS in the primary plus a second region; the brief didn’t ask for one.'}},
{a:'rsv-brindle-cc',o:['rsv-brindle-ce'],t:'vault',why:'A Recovery Services vault must be in the <b>same region</b> as the VMs it protects (Canada Central).',w:{'rsv-brindle-ce':'Canada East. Wrong region for a Canada Central VM.'}}],
out:['rg-brindle-yyc ✓  lock no-delete (CanNotDelete) ✓','vnet-yyc / snet-shop 10.60.1.0/24 · nsg-shop · Microsoft.Storage ✓','stbrindleyyc Standard_ZRS · defaultAction Deny ✓','vm-yyc-pos running · protected by rsv-brindle-cc (DefaultPolicy) ✓']});

S({id:'ir-isolate',mode:'fix',lang:'pwsh',domains:['networking','compute','identity'],tags:['nsg','snapshot','rbac'],file:'ir-emr02.ps1',
title:'Fix it: incident response script locked out the SOC',
scenario:'Harrowfen suspects <code>vm-emr-02</code> is compromised. The IR script must (1) block all inbound traffic <b>except SSH from the SOC jump box 10.0.9.4</b>, (2) snapshot the OS disk for evidence, and (3) remove a contractor’s VM role on that VM.',
symptom:'SOC jump box can’t SSH to vm-emr-02, and the portal still shows the old rules on nsg-nic-emr02.',
learn:[['NSG rule priority',L+'azure/virtual-network/network-security-groups-overview#security-rules'],['Snapshot with PowerShell',L+'azure/virtual-machines/snapshot-copy-managed-disk?tabs=powershell']],
code:String.raw`$nsg = Get-AzNetworkSecurityGroup -Name nsg-nic-emr02 -ResourceGroupName rg-harbor-emr
Add-AzNetworkSecurityRuleConfig -NetworkSecurityGroup $nsg -Name deny-all-in ~
    -Priority {{1}} -Direction Inbound -Access Deny -Protocol * ~
    -SourceAddressPrefix * -SourcePortRange * -DestinationAddressPrefix * -DestinationPortRange *
Add-AzNetworkSecurityRuleConfig -NetworkSecurityGroup $nsg -Name allow-soc ~
    -Priority {{2}} -Direction Inbound -Access Allow -Protocol Tcp ~
    -SourceAddressPrefix 10.0.9.4 -SourcePortRange * -DestinationAddressPrefix * -DestinationPortRange 22
{{3}} -NetworkSecurityGroup $nsg

$vm  = Get-AzVM -ResourceGroupName rg-harbor-emr -Name vm-emr-02
$cfg = New-AzSnapshotConfig -SourceUri $vm.StorageProfile.OsDisk.ManagedDisk.Id ~
    -Location $vm.Location -CreateOption {{4}}
New-AzSnapshot -ResourceGroupName rg-harbor-ir -SnapshotName snap-emr02-ir -Snapshot $cfg

Remove-AzRoleAssignment -SignInName "contractor@harrowfen.example" ~
    -RoleDefinitionName "Virtual Machine Contributor" -Scope {{5}}`,
b:[{a:'4000',bug:'100',o:['4097'],t:'nsg',why:'The deny must be evaluated <b>after</b> the SOC allow. Lower number wins.',w:{'100':'Evaluated before allow-soc (200), so the SOC is blocked too.','4097':'Out of range (100–4096).'}},
{a:'200',o:['4096'],t:'nsg',why:'Lower than the deny, so it’s checked first. (This line was already right.)',w:{'4096':'After the deny at 4000; it would never match.'}},
{a:'Set-AzNetworkSecurityGroup',bug:'Set-AzNetworkSecurityRuleConfig',o:['Get-AzNetworkSecurityGroup'],t:'nsg',why:'*-RuleConfig cmdlets only edit the local object. <b>Set-AzNetworkSecurityGroup</b> sends it to Azure.',w:{'Set-AzNetworkSecurityRuleConfig':'Edits a rule in the local object; nothing is saved to Azure.','Get-AzNetworkSecurityGroup':'Reads it again; the changes are lost.'}},
{a:'Copy',o:['Empty','Attach'],t:'snapshot',why:'Copy = a point-in-time copy of the source disk. (This line was already right.)',w:{'Empty':'Creates an empty disk.','Attach':'For attaching existing disks to VMs.'}},
{a:'$vm.Id',o:['"/"','$vm.Name'],t:'rbac',why:'Remove the assignment at the scope where it was made: the VM. (This line was already right.)',w:{'"/"':'Root scope; the assignment isn’t there.','$vm.Name':'Scope needs an ID.'}}],
out:['nsg-nic-emr02: allow-soc (200) ✓ · deny-all-in (4000) ✓ · saved','Snapshot snap-emr02-ir: Succeeded','Removed: contractor@… · Virtual Machine Contributor · vm-emr-02','ssh from 10.0.9.4 → connected']});

S({id:'web-bicep',mode:'complete',lang:'bicep',domains:['compute','networking','monitor'],tags:['bicep','app-service','diag'],file:'intake-web.bicep',
title:'Bicep: Linux web app with VNet integration and logs',
scenario:'Orrin &amp; Pell’s intake app runs on <b>Linux</b>, needs <b>deployment slots and VNet integration</b> at the lowest tier with both, and sends HTTP logs to Log Analytics.',
learn:[['App Service plans',L+'azure/app-service/overview-hosting-plans'],['VNet integration',L+'azure/app-service/overview-vnet-integration'],['Diagnostic settings in Bicep',L+'azure/azure-monitor/essentials/resource-manager-diagnostic-settings']],
code:String.raw`param location string = resourceGroup().location
param lawId string

resource snet 'Microsoft.Network/virtualNetworks/subnets@2024-01-01' existing = {
  name: 'vnet-orrin/snet-appsvc'
}

resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: 'asp-orrin'
  location: location
  sku: { name: {{1}} }
  kind: 'linux'
  properties: { reserved: {{2}} }
}

resource app 'Microsoft.Web/sites@2023-12-01' = {
  name: 'app-orrin-intake'
  location: location
  properties: {
    serverFarmId: {{3}}
    virtualNetworkSubnetId: snet.id
    httpsOnly: true
  }
}

resource diag 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = {
  name: 'app-to-law'
  scope: {{4}}
  properties: {
    workspaceId: lawId
    logs: [ { category: 'AppServiceHTTPLogs', enabled: true } ]
  }
}`,
b:[{a:`'S1'`,o:[`'B1'`,`'F1'`,`'P1v3'`],t:'app-service',why:'VNet integration starts at Basic; slots start at <b>Standard</b>. The lowest tier with both is S1.',w:{[`'B1'`]:'Basic has VNet integration but no slots.',[`'F1'`]:'Free has neither.',[`'P1v3'`]:'Has both, but isn’t the lowest.'}},
{a:'true',o:['false'],t:'app-service',why:'Linux plans need <code>reserved: true</code>.',w:{'false':'false means a Windows plan.'}},
{a:'plan.id',o:['plan.name',`'asp-orrin'`],t:'bicep',why:'A symbolic reference (<code>plan.id</code>) gives the resource ID <b>and</b> an implicit dependency.',w:{'plan.name':'serverFarmId expects the resource ID.',[`'asp-orrin'`]:'A plain string: no ID, and no dependency.'}},
{a:'app',o:['plan','resourceGroup()'],t:'diag',why:'Diagnostic settings are an extension resource scoped to the thing being monitored.',w:{'plan':'Plans don’t emit AppServiceHTTPLogs.','resourceGroup()':'Resource groups don’t take diagnostic settings.'}}],
out:['Resource changes: 3 to create','+ asp-orrin (S1, linux)  + app-orrin-intake (vnet: snet-appsvc)  + app-to-law','Deployment succeeded']});

S({id:'mi-blob',mode:'fix',lang:'azcli',domains:['identity','storage','compute'],tags:['mi','rbac'],file:'notebook-access.sh',
title:'Fix it: the notebook VM can see the account but not the data',
scenario:'Saltquill Labs’ notebook VM reads genomes from the <code>genomes</code> container using its <b>managed identity</b>. Shared-key access is disabled on the account. Read-only is enough.',
symptom:'(AuthorizationPermissionMismatch) This request is not authorized to perform this operation using this permission.\nWith --auth-mode key: "Key based authentication is not permitted on this storage account."',
learn:[['Configure managed identities on a VM',L+'entra/identity/managed-identities-azure-resources/qs-configure-cli-windows-vm'],['Authorize blob access with Azure CLI',L+'azure/storage/blobs/authorize-data-operations-cli']],
code:String.raw`az vm identity assign -g rg-saltquill -n vm-notebook-01
PRINCIPAL=$(az vm show -g rg-saltquill -n vm-notebook-01 --query {{1}} -o tsv)

az role assignment create --assignee-object-id "$PRINCIPAL" \
  --assignee-principal-type ServicePrincipal \
  --role {{2}} \
  --scope "$SA_ID/blobServices/default/containers/genomes"

# on the VM:
az login --identity
az storage blob download --account-name stsaltquilllake -c genomes -n run-118.fastq \
  -f ./run-118.fastq {{3}}`,
b:[{a:'identity.principalId',o:['identity.tenantId','vmId'],t:'mi',why:'The managed identity’s object ID. (This line was already right.)',w:{'identity.tenantId':'That’s the tenant, not the identity.','vmId':'The VM’s own unique ID, not an Entra principal.'}},
{a:'"Storage Blob Data Reader"',bug:'"Storage Account Contributor"',o:['"Reader"'],t:'rbac',why:'Reading blob <b>data</b> with Entra auth needs a <b>data-plane</b> role. Management roles don’t grant it.',w:{'"Storage Account Contributor"':'Manages the account (and can read keys), but with shared keys disabled it grants no data access.','"Reader"':'Sees the account in the portal; no data access.'}},
{a:'--auth-mode login',bug:'--auth-mode key',o:['--sas-token "$SAS"'],t:'mi',why:'Use the signed-in (managed) identity.',w:{'--auth-mode key':'Shared-key auth is disabled on this account.','--sas-token "$SAS"':'Needs a SAS someone generates; it defeats the point of the identity.'}}],
out:['{ "type": "SystemAssigned", "principalId": "b07c…" }','Role Storage Blob Data Reader → genomes','Finished[#############################################################]  100.0000%']});

window.CTS_DECK={id:'cts',title:'Complete the Script',concepts,missions:s};
})();
