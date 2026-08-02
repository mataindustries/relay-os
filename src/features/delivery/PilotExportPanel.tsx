import { useState, type FormEvent } from 'react';

import { useRelaySession } from '../../app/useRelaySession';
import {
  createPilotHandoffPackage,
  pilotHandoffFilename,
  serializePilotHandoffPackage,
} from '../../domain';

export function PilotExportPanel() {
  const { snapshot, currentTime } = useRelaySession();
  const [includeSourceText, setIncludeSourceText] = useState(false);
  const [sourceTextConfirmed, setSourceTextConfirmed] = useState(false);
  const [feedback, setFeedback] = useState<{
    readonly ok: boolean;
    readonly message: string;
  } | null>(null);

  function exportPackage(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    setFeedback(null);
    if (includeSourceText && !sourceTextConfirmed) {
      setFeedback({
        ok: false,
        message: 'Confirm the separate source-text warning before including raw source text.',
      });
      return;
    }

    const result = createPilotHandoffPackage(snapshot, {
      exportedAt: currentTime(),
      includeSourceText,
    });
    if (!result.ok) {
      setFeedback({ ok: false, message: result.error.message });
      return;
    }

    const blob = new Blob([serializePilotHandoffPackage(result.value)], {
      type: 'application/json;charset=utf-8',
    });
    const objectUrl = URL.createObjectURL(blob);
    try {
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = pilotHandoffFilename(snapshot.company?.name);
      link.click();
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
    setFeedback({
      ok: true,
      message: includeSourceText
        ? 'JSON handoff downloaded with explicitly confirmed source text.'
        : 'JSON handoff downloaded with raw source text excluded.',
    });
  }

  return (
    <section className="pilot-export-panel no-print" aria-labelledby="pilot-export-title">
      <p className="eyebrow">Session-only handoff</p>
      <h2 id="pilot-export-title">Export the pilot package</h2>
      <p>
        Download an allowlisted JSON handoff of the actual current session. Export does not change
        RelayOS records and is not durable persistence. Phase 4 provides no import.
      </p>
      <form className="stacked-form export-form" onSubmit={exportPackage}>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={includeSourceText}
            onChange={(event) => {
              setIncludeSourceText(event.target.checked);
              if (!event.target.checked) setSourceTextConfirmed(false);
            }}
          />
          Include raw source text and source-reference excerpts (off by default)
        </label>
        {includeSourceText ? (
          <label className="checkbox-row source-confirmation">
            <input
              type="checkbox"
              checked={sourceTextConfirmed}
              onChange={(event) => setSourceTextConfirmed(event.target.checked)}
            />
            I explicitly confirm that this source text is appropriate for this downloaded handoff.
          </label>
        ) : null}
        <p className="record-meta">
          Raw employee question text, structured free-text context, sensitive raw values, and
          free-text escalation resolutions are excluded in both modes.
        </p>
        <button className="primary-button" type="submit">
          Download JSON handoff
        </button>
      </form>
      {feedback ? (
        <p className={feedback.ok ? 'form-feedback success' : 'form-feedback error'} role="status">
          {feedback.message}
        </p>
      ) : null}
    </section>
  );
}
