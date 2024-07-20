import { astroI18n } from 'astro-i18n';
import { getCollection } from 'astro:content';

export async function getBlogs() {
  const localizedBlogs = await getCollection('blogs', ({ data }) => {
    return !data.draft && astroI18n.locale === data.lang;
  });

  const sortedBlogs = localizedBlogs.sort(
    (a, b) => b.data.createdAt - a.data.createdAt,
  );

  return sortedBlogs;
}
