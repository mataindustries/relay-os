# Demo boundary

Phase 2 extends the fixed, clearly fictional Summit Comfort Heating & Air
record. Its identifiers, timestamps, document versions, anchors, topic claims,
gaps, questions, answer, and decisions are deterministic. Loading the fixture
repeatedly into the same repository is idempotent.

Demo code must use the same domain and repository boundaries as user-entered
data. It must not call a model, use browser persistence, make network requests,
or bypass approval and employee-visibility rules.
