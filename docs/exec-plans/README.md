# Execution plans

Execution plans are living implementation records. Before changing code, read the plan whose scope owns the change. If no plan authorizes the work, create or obtain approval for one rather than extending a phase implicitly. Future domain documentation is not implementation permission.

## Current baseline

- [Phase 0: Repository foundation](phase-0-foundation.md) — complete; foundation only

Do not begin Phase 1 without a separately reviewed execution plan. Completion of the foundation does not authorize later-phase implementation.

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
