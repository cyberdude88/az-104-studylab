# Practice Test: format, item spec and competency model

**Page:** `practice.html` (white, exam-style). **Bank:** `practice/core.js` + `practice/bank-<domain>.js`. **Engine:** `practice.js`. **Validator:** `node tools/validate-bank.js`.

## 1. What the 25 Nov practice exam looked like

These figures come from the 31 items that were missed, which are the ones stored with full text. The 23 correct items were stored by title only.

| Type | Share of misses | Shape |
|---|---|---|
| Single choice | 32% | Scenario, then "What should you do?" with 4 options. The distractors are near misses: the right tool used the wrong way. |
| Multi-select | 23% | "Which two / three / four…?" The count is always stated. "Each correct answer presents a **complete** solution" means every pick works on its own. "…**part of** the solution" means the picks only work together. |
| Dropdown / hot area | 19% | Fill the gaps in a command or configuration. The traps are at parameter level. |
| Build list (order) | 16% | "Which three actions should you perform in sequence?" There are 5–7 cards, 2–3 of them traps. One item used "any order". |
| Yes / No statements | 13% | Three statements about one scenario. |

* **Code content:** 35% of the misses contained PowerShell; Bicep/ARM and Azure CLI also appear. Code is plain commands and templates, not bash scripting.
* **Stems:** 40–230 words, median about 120. The longer stems stack several constraints, such as minimizing cost, minimizing administrative effort, and meeting all requirements.
* **No case studies or "Solution: … does this meet the goal?" series appeared in this set.** The real exam can include case studies, so the bank includes some.
* **Owner direction (25 Nov):**
  * The page has a white background.
  * Use more sentences, with white space between them.
  * Answer selection (single and multi) and finishing the script are the most common formats.
  * Use Bicep, Azure CLI and PowerShell much more than bash.

**Target mix per domain set:**

| Format | Share |
|---|---|
| Single + multi | ≈ 50% |
| Code fill-in (Bicep / Azure CLI / PowerShell, sometimes ARM JSON or KQL) | ≈ 25–30% |
| Order | ≈ 10% |
| Yes/No | ≈ 10% |
| Prose dropdown | Optional |

Each domain set also includes **one 3-part case study**.

## 2. Item spec

Bank files register items with `Q({...})`:

```js
/* practice/bank-<domain>.js */
(function(Q){
Q({ ... });
})(window.PT.Q);
```

### Common fields (every item)

| Field | Rule |
|---|---|
| `id` | kebab-case, unique, domain prefix: `id-` `st-` `cp-` `nw-` `mo-` |
| `type` | `single` · `multi` · `yesno` · `order` · `code` · `dropdown` · `case` |
| `obj` | objective key from `practice/core.js` (`entra`, `access`, `governance`, `st-access`, `st-accounts`, `files-blob`, `iac`, `vms`, `containers`, `appsvc`, `vnets`, `secure-net`, `dns-lb`, `monitor`, `backup`) |
| `tags` | 1–3 concept ids from `scripts/deck.js` `concepts` (shared heat with Complete the Script and the Sheet priorities) |
| `diff` | difficulty −1 (easy) · 0 (typical) · 1 (hard) · 2 (very hard). Most items are 0 or 1. |
| `stem` | **array of paragraphs**, 60–220 words in total: the scenario, the environment and the requirements, written in full sentences. A paragraph may contain `<b>`, `<code>`, or a short `<ul><li>` list of requirements or settings. |
| `ask` | The final question, which contains a `?`. For multi-select it states the count, then the solution rule, e.g. `Which two actions should you perform? Each correct answer presents part of the solution.` |
| `why` | 2–5 sentences: why the right answer is right and why the strongest trap is wrong |
| `learn` | `[[label, 'https://learn.microsoft.com/...'], ...]`, 1–3 links to real pages |
| `vars` | optional rewording pools for item-local names: `{vm:['vm-web1','vm-app2']}`, used as `%vm%` |

**Global vars**, usable in any text: `%org%` (company), `%dns%` (its `.example` domain), `%person%`, `%person2%`, `%region%`, `%region2%` (the paired region). The engine picks fresh values for each presentation, so the same item reads differently each time. Vars may only change **names**, never the answer.

### Type fields

* **`single`**: `opts` (3–6 strings), `a` (index).
* **`multi`**: `opts` (4–7), `a` (array of indices, at least 2), `sol: 'complete' | 'part'`.
* **`yesno`**: `stmts`: exactly 3 entries of `[statement, true|false, reason]`.
* **`order`**: `cards` (4–8 actions), `seq` (indices in the correct order; at least one card must be a trap left out), optional `any: true` when the order does not matter.
* **`code`**:
  * `lang` (`bicep` · `azcli` · `pwsh` · `json` · `kql`), optional `file` name.
  * `code`: the source with `{{1}}`, `{{2}}`… blanks.
  * `b`: one `{o:[options], a:index}` per blank, with 3–6 options.
  * Azure CLI is **plain `az` commands** (line continuation with `\` is fine). No `$(...)`, loops, `export` or pipes.
* **`dropdown`**: `text` (a string or an array of lines of prose or settings with `{{n}}` blanks) and `b`, the same as for `code`.
* **`case`**:
  * `title`.
  * `tabs`: at least 3 entries of `[name, [paragraphs]]`, 250+ words in total, e.g. Overview / Existing environment / Requirements / Technical requirements.
  * `parts`: **exactly 3** sub-items. Each is any non-case type, with its own `type`, `obj`, `tags`, `diff`, `stem` (25+ words; it may refer to the case), `ask`, `why` and type fields. `learn` is optional per part.

### Content rules

* All companies, people and domains are fictional. Use the pools above or invent new ones ending in `.example`.
* Never use Microsoft's sample brands (Contoso, Fabrikam, Adatum, Litware…) or any practice-test vendor names.
* Write every scenario from scratch. Never reproduce or closely paraphrase a question from any exam or practice test.
* Every fact, command and parameter must be checked against current Microsoft Learn: use names as they are today (Microsoft Entra ID, Azure Monitor Agent, and so on).
* Distractors must be plausible near misses: a real parameter used in the wrong place, the right service at the wrong scope, or a step that sounds required but isn't.
* Never use "all of the above", and never write joke options.

### Example

```js
Q({id:'nw-peer-transit',type:'single',obj:'vnets',tags:['peering','vpn'],diff:1,
  vars:{hub:['vnet-hub','vnet-core'],spoke:['vnet-app','vnet-data']},
  stem:['%org% runs a hub-and-spoke network in %region%. The hub virtual network, %hub%, contains a VPN gateway that connects to the head office.',
        'A new spoke, %spoke%, is peered to %hub%. Virtual machines in %spoke% can reach the hub, but they cannot reach any on-premises address.',
        'You must allow the spoke to use the existing gateway. The solution must not deploy another gateway.'],
  ask:'What should you configure?',
  opts:['Allow gateway transit on the hub peering and use remote gateways on the spoke peering',
        'Use remote gateways on the hub peering and allow gateway transit on the spoke peering',
        'A route table on the spoke subnet with next hop Virtual network gateway',
        'Allow forwarded traffic on both peerings'],
  a:0,
  why:'Gateway transit is enabled on the side that owns the gateway (the hub), and "use remote gateways" on the side that borrows it (the spoke). Reversing them fails because the spoke has no gateway to share. Forwarded traffic is for NVAs, not gateway transit.',
  learn:[['Gateway transit for peering','https://learn.microsoft.com/en-us/azure/vpn-gateway/vpn-gateway-peering-gateway-transit']]});
```

## 3. Competency model (psychometric)

* **Ability per objective.**
  * Each of the 15 objectives keeps an ability estimate `θ` and an information total `I`, where the standard error is `1/√I`.
  * The starting `θ` comes from the 25 Nov objective scores, shrunk 50/50 toward that domain's score and clamped to 10–90%, giving `θ₀ = logit(p)`. Starting information is `I₀ = 1.2`.
* **Each response** (Rasch / 1PL):
  * The chance of a correct answer is `P = 1/(1+e^−(θ−b))`, where `b` is the item's `diff`.
  * The score `s` is in 0–1, and partial credit counts for multi, yes/no, order and code items.
  * The update is `I += P(1−P)`, then `θ += (s−P)/I`.
  * `I` is capped at 12 so the estimate keeps tracking learning, and it decays by 3% per day without practice.
* **Scaled estimate.**
  * Each objective is reported as `700 + 200·(θ − logit 0.70)`, clamped to 100–1000.
  * The 700 line is the pass mark: about 70% correct on typical-difficulty items. This is an estimate, not Microsoft's scoring.
  * The ±band shown is `200·SE`.
* **Domain and overall.** A domain is the mean of its objectives. Overall is the exam-weighted mean of the domains (20–25 / 15–20 / 20–25 / 15–20 / 10–15%).
* **Adaptive pick.** The next item is the one with the highest:

  `info(P) × (1 + weakness) × heat factor × format factor × freshness`

  * `weakness` is the distance below 700.
  * `heat factor` comes from concept heat, including the High / Low / Ignore priorities set in the Sheet.
  * `format factor` boosts formats with low accuracy.
  * `freshness` keeps items you have answered correctly out of rotation for 3 days. An item you missed returns after 1 day with new names.

## 4. Modes

| Mode | Feedback | Length | Notes |
|---|---|---|---|
| Adaptive | After each item | Until **End** | Targets the weakest objectives and formats |
| Ongoing | After each item | Until **End** | Weighted mix of everything, keeps rotating formats |
| Exam simulation | At the end | 50 items, 100 min | Exam blueprint by domain weight, includes a case study, mark for review |
| Case studies | After each part | One case | Three parts, the scenario stays open in tabs |

The live side panel shows the overall estimate, the points still needed to reach 700, the change this session, a bar per domain against the 700 line, the item count, a timer, a **scratch pad** toggle and **End**. **End** returns to the dashboard:

* **Distance to pass:** a horizontal bar chart of the overall and domain estimates on the 100–1000 scale. The hatched segment is the gap to 700, and the 15 objectives expand below it, weakest first.
* the trend of the overall and domain estimates over sessions;
* accuracy by format;
* recent sessions.

All of this syncs to the `Lab_Competency` tab in the Sheet.

## 5. Bank v1 (25 Nov 2026)

There are 75 scored questions: 60 standalone plus 5 case studies × 3 parts, with 15 per domain.

| Format | Count |
|---|---|
| Single | 27 |
| Multi | 13 |
| Code | 20 |
| Order | 6 |
| Yes/No | 5 |
| Dropdown | 4 |

The code items break down as Azure CLI 9 · PowerShell 5 · Bicep 3 · ARM JSON 2 · KQL 1.

**Next additions:** more Bicep (the owner sees it often), plus a second case study per domain.

### Facts to recheck

Each writer checked against Microsoft Learn and flagged the facts below as inferred or likely to change.

- **Identity**
  * `$assignment.IdentityPrincipalId` (Az 12+) in the remediation script. It is fixed text, not a blank.
  * The tag-inherit built-in uses `tagName` and needs Contributor, or Tag Contributor operations.
- **Storage**
  * AzCopy now supports Microsoft Entra auth for Azure Files directory and file operations; SAS is still needed when a command targets only the share or account.
  * LRS → GZRS is two conversions, and they can run in either order.
  * The case `network-rule add --vnet-name/--subnet` form.
- **Compute**
  * The ARM api-versions are from memory.
  * The registration prerequisite for encryption at host.
  * Container Apps traffic pinning before an update.
- **Networking**
  * The Bicep child-zone delegation reads `childZone.properties.nameServers` into a var. This matches the Learn pattern, but it has not been compiled.
  * New VNets get private subnets by default after 31 Mar 2026.
  * `Microsoft.Storage` vs `Microsoft.Storage.Global` service endpoints.
- **Monitor**
  * The Standard policy now supports Trusted Launch through CLI/PowerShell/REST, so the Enhanced item relies on RPO and Premium SSD v2 instead.
  * Reusing a diagnostic-setting name replaces that setting (it is a CreateOrUpdate call).
