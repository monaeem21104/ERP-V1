# Permission matrix

Permissions are stored in the database (`Permission.key`) as `resource.action`. Roles are configurable; the seed creates starting roles and mappings. Super Administrator bypasses permission checks but still operates inside an authenticated session and is fully audited.

## Resources and actions

| Resource | Actions |
| --- | --- |
| dashboard | read |
| users | read, create, update, manage, invite, reset_password |
| roles | read, manage |
| audit | read |
| settings | read, update |
| companies | read, manage |
| customers | read, create, update, delete |
| suppliers | read, create, update, delete |
| products | read, create, update, delete |
| warehouses | read, create, update, delete |
| inventory | read, create, update, delete, adjust, transfer, approve, count |
| purchasing | read, create, update, delete, approve, receive |
| sales | read, create, update, delete, approve, deliver, discount |
| accounting | read, create, update, post, reverse, export |
| manufacturing | read, create, update, delete, approve, plan, complete |
| returns | read, create, update, approve, inspect |
| maintenance | read, create, update, complete |
| hr | read, create, update, manage |
| payroll | read, process, export |
| reports | read, export |
| einvoicing | read, submit, cancel |
| notifications | read |
| attachments | read, create, delete |

## Default role intent

| Role | Typical access |
| --- | --- |
| Super Administrator | Platform + all companies |
| Company Administrator | All company permissions except platform bootstrap |
| Finance Manager | Accounting, AR/AP, reports.export, payments approve |
| Accountant | accounting.read/create/post (no reverse unless granted) |
| Production Manager | manufacturing.*, inventory.read, products.read |
| Production Operator | manufacturing.read/update (operations), not approve |
| Inventory Manager | inventory.*, warehouses, products |
| Warehouse Operator | inventory.read/create/transfer, not adjust/approve |
| Purchasing Manager | purchasing.*, suppliers |
| Sales Manager | sales.*, customers, discount |
| Sales Representative | sales.read/create, customers.read |
| HR Manager | hr.*, payroll.* |
| Maintenance Technician | maintenance.read/create/update/complete |
| Auditor | *.read, audit.read, reports.read (no mutate) |
| Read-Only User | selected *.read |
| Standard User | dashboard.read, own profile; no sensitive business data |

Public registration always maps to **Standard User**.
