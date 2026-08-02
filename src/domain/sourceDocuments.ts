import type { SourceDocumentLine } from './entities';

/** Normalizes line endings only; document wording and whitespace remain owner supplied. */
export function normalizeSourceContent(content: string): string {
  return content.replaceAll('\r\n', '\n').replaceAll('\r', '\n');
}

export function numberSourceLines(content: string): readonly SourceDocumentLine[] {
  return normalizeSourceContent(content)
    .split('\n')
    .map((text, index) => ({ lineNumber: index + 1, text }));
}

export function excerptSourceLines(
  lines: readonly SourceDocumentLine[],
  startLine: number,
  endLine: number,
): string {
  return lines
    .slice(startLine - 1, endLine)
    .map(({ text }) => text)
    .join('\n');
}

export function sourceDocumentLocator(
  documentId: string,
  version: number,
  startLine: number,
  endLine: number,
): string {
  return `Document ${documentId} v${version}, lines ${startLine}-${endLine}`;
}

export function ownerInterviewLocator(questionId: string, answerId: string): string {
  return `Owner interview question ${questionId}; answer ${answerId}`;
}
