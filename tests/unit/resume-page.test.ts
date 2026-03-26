import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const resumePageSource = readFileSync(
  resolve(process.cwd(), 'src/pages/resume.astro'),
  'utf8',
);

describe('resume page content', () => {
  it('uses Chinese-only visible section kickers', () => {
    expect(resumePageSource).not.toContain('>Summary<');
    expect(resumePageSource).not.toContain('>Capabilities<');
    expect(resumePageSource).not.toContain('>Experience<');
    expect(resumePageSource).not.toContain('>Projects<');

    expect(resumePageSource).toContain('>概述<');
    expect(resumePageSource).toContain('>能力<');
    expect(resumePageSource).toContain('>经历<');
    expect(resumePageSource).toContain('>项目<');
  });
});
