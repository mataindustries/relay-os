# Execution plans

Execution plans are living implementation records. Before changing code, read the plan whose scope owns the change. If no plan authorizes the work, create or obtain approval for one rather than extending a phase implicitly. Future domain documentation is not implementation permission.

## Current baseline

- [Phase 0: Repository foundation](phase-0-foundation.md) — complete; foundation only
- [Phase 1: Company and Role Engine](phase-1-company-role-engine.md) — complete; session-only company, role, and approval vertical slice
- [Phase 2: Source Intake and Knowledge Gap Interviewer](phase-2-source-intake-interviewer.md) — complete; session-only source and gap-interview vertical slice
- [Phase 3: Deterministic Question-to-System](phase-3-question-to-system.md) — complete; session-only employee question policy firewall and owner escalation vertical slice

Phase 3 is the current completed baseline. No later implementation plan is active. Do not begin Phase 4 or infer permission for AI, persistence, authentication, uploads, messaging, training, or scoring from future product documentation.

## Required contents

Each plan records:

- goal and explicit non-goals;
- work breakdown and ownership boundaries;
- testable acceptance criteria;
- validation commands and their exact results;
- decisions made while executing;
- remaining known limitations;
- completion status.

Keep the plan concise and update it as facts change. Link durable product or architecture decisions to the canonical document rather than copying large explanations into the plan.

## Working protocol

1. Confirm the requested work fits the plan and its non-goals.
2. Mark the current work item in progress before implementation.
3. Implement the smallest coherent change and add proportionate tests.
4. Record decisions that affect later work; create an ADR for durable, cross-cutting choices.
5. Run the plan’s focused checks and complete noninteractive quality gate.
6. Record commands, results, and honest limitations.
7. Mark complete only when every acceptance criterion passes. Do not use plan completion to start an unplanned later phase.

Environmental failures must record the exact command, error, likely cause, attempted repairs, and next action. Product or security invariants are not waived because validation is unavailable.

Repository-wide guidance is in [AGENTS.md](../../AGENTS.md); the foundation architecture is in [ARCHITECTURE.md](../../ARCHITECTURE.md).
