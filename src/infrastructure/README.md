# Infrastructure boundary

Phase 2 continues to provide only an in-memory implementation of the domain repository
interfaces. It preserves the domain's write boundary, returns defensive copies,
and has no browser, network, authentication, model, or durable-storage
dependency. A reload intentionally discards every record.

Future external adapters belong here only when an execution plan authorizes
them. Browser code must never contain API secrets.
