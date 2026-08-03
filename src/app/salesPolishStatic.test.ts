import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repositoryRoot = process.cwd();

describe('RoleKeep static sales presentation', () => {
  it('provides focused role-transfer metadata without a fake social image', () => {
    const indexHtml = readFileSync(resolve(repositoryRoot, 'index.html'), 'utf8');

    expect(indexHtml).toContain('<title>RoleKeep — Transfer the role. Keep the judgment.</title>');
    expect(indexHtml).toContain(
      'RoleKeep turns owner-approved knowledge into guidance, decision limits, and escalation rules for a home-service Office Manager or Dispatcher.',
    );
    expect(indexHtml).toContain('property="og:title"');
    expect(indexHtml).toContain('property="og:description"');
    expect(indexHtml).toContain('property="og:type" content="website"');
    expect(indexHtml).toContain('name="twitter:card" content="summary"');
    expect(indexHtml).toContain('name="theme-color" content="#163b35"');
    expect(indexHtml).not.toContain('og:image');
  });

  it('references a checked-in, dependency-free RoleKeep favicon', () => {
    const indexHtml = readFileSync(resolve(repositoryRoot, 'index.html'), 'utf8');
    const faviconPath = resolve(repositoryRoot, 'public/favicon.svg');

    expect(indexHtml).toContain('<link rel="icon" href="/favicon.svg" type="image/svg+xml" />');
    expect(existsSync(faviconPath)).toBe(true);

    const favicon = readFileSync(faviconPath, 'utf8');
    expect(favicon).toContain('<svg');
    expect(favicon).toContain('viewBox="0 0 64 64"');
    expect(favicon).not.toContain('<image');
    expect(favicon).not.toContain('RelayOS');
  });
});
