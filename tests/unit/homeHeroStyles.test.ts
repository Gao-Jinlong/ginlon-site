import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('HomeHero responsive styles', () => {
  it('adds a desktop hero title override so wide screens do not collapse into a narrow headline column', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/HomeHero.astro'), 'utf8');

    expect(source).toContain('@media (min-width: 900px)');
    expect(source).toMatch(
      /@media \(min-width: 900px\)[\s\S]*?\.hero-title\s*{[\s\S]*?max-width:\s*none;/
    );
  });
});
