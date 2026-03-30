import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('resume page redirect', () => {
  it('redirects /resume to /about', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/pages/resume.astro'), 'utf8');

    expect(source).toContain('RedirectPage');
    expect(source).toContain('"/about"');
  });
});
