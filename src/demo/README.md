# Demo boundary

Phase 1 contains the fixed, clearly fictional Summit Comfort Heating & Air
record. Its identifiers, timestamps, sources, role system, claims, and decisions
are deterministic. Loading the fixture repeatedly into the same repository is
idempotent.

Demo code must use the same domain and repository boundaries as user-entered
data. It must not call a model, use browser persistence, make network requests,
or bypass approval and employee-visibility rules.
