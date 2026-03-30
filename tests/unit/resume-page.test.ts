import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const resumePageSource = readFileSync(
  resolve(process.cwd(), 'src/pages/resume.astro'),
  'utf8',
);

const techStackSource = readFileSync(
  resolve(process.cwd(), 'src/pages/techStack.astro'),
  'utf8',
);

describe('retired legacy routes', () => {
  it('redirects /resume to /about', () => {
    expect(resumePageSource).toContain('RedirectPage');
    expect(resumePageSource).toContain('/about');
    expect(resumePageSource).not.toContain('Main');
  });

  it('redirects /techStack to /writing', () => {
    expect(techStackSource).toContain('RedirectPage');
    expect(techStackSource).toContain('/writing');
    expect(techStackSource).not.toContain('Main');
  });
});
