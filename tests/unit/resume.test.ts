import { describe, expect, it } from 'vitest';

import { resumePageContent } from '../../src/data/resume';

describe('resume page content', () => {
  it('keeps only the approved public contact fields', () => {
    expect(resumePageContent.header.name).toBe('高金龙');
    expect(resumePageContent.header.email).toBe('ginlon5241@gmail.com');
    expect(resumePageContent.header.website.label).toBe('ginlon.site');
    expect(resumePageContent.header).not.toHaveProperty('phone');
    expect(resumePageContent.header).not.toHaveProperty('photo');
  });

  it('keeps exactly three work entries and three core projects', () => {
    expect(resumePageContent.experience).toHaveLength(3);
    expect(resumePageContent.projects).toHaveLength(3);
  });

  it('does not leak removed sections or non-core projects', () => {
    const serialized = JSON.stringify(resumePageContent);

    expect(serialized).not.toContain('136');
    expect(serialized).not.toContain('接龙管家');
    expect(serialized).not.toContain('面训');
  });
});
