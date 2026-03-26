import type { AppLocale } from '../i18n/utils';
import { getAllTags } from './getTags';

export async function getTagStaticPaths(locale: AppLocale) {
  const tags = await getAllTags(locale);

  return tags.map((tag) => ({
    params: { tag: tag.slug },
    props: { tagName: tag.name },
  }));
}
