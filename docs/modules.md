# Module map

| Module | Owns | Key workflows |
| --- | --- | --- |
| Auth | Sessions, passwords, MFA, bootstrap | Login, refresh, lockout, password change |
| IAM | Users, roles, permissions, memberships | Invite, assign roles, scopes |
| Audit | Audit logs | Sensitive action recording |
| Org | Companies, branches, departments, warehouses | Tenant setup |
| Master data | Products, UoM, tax, partners | SKU, customers, suppliers |
| Inventory | Stock, movements, counts, lots/serials | Receive, issue, transfer, adjust |
| Purchasing | PR, RFQ, PO, GRN, AP invoice | Approve, partial receive |
| Sales | Quotes, SO, DN, AR invoice | Credit limit, deliver, invoice |
| Accounting | CoA, journals, periods, statements | Post, reverse, AR/AP, cash |
| Manufacturing | BOM, routing, WO, MRP | Consume, receive FG, variance |
| Returns | RMA, purchase returns | Inspect, restock, credit |
| Maintenance | Assets, PM, work orders | Downtime, spare parts |
| HR | Employees, leave, attendance, payroll | Payslips (restricted) |
| E-invoicing | Adapter layer | Validate, submit, retry (no fake gov APIs) |
| Notifications | In-app + email adapter | Approval requests |
| Approvals | Configurable steps | Persist decisions server-side |
| Reports | Query + export jobs | CSV/XLSX/PDF |
| Settings | Policies, locale, numbering | Company configuration |
