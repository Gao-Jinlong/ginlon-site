import { astroI18n } from 'astro-i18n';
import { getCollection } from 'astro:content';
import dayjs from 'dayjs';

export async function getBlogs() {
  const localizedBlogs = await getCollection('blogs', ({ data }) => {
    return !data.draft;
  });

  const locale = astroI18n.locale;
  const fallbackLocale = astroI18n.fallbackLocale;
  const primaryLocale = astroI18n.primaryLocale;
  const secondaryLocales = astroI18n.secondaryLocales;

  const blogs = [...secondaryLocales, primaryLocale].map(locale => {
    return {
      locale,
      blogs: localizedBlogs.filter(blog => blog.data.lang === locale),
    };
  });

  const finalBlogMap = new Map();

  const fallbackLocaleBlogs =
    blogs.find(blog => blog.locale === fallbackLocale)?.blogs || [];
  const primaryLocaleBlogs =
    blogs.find(blog => blog.locale === locale)?.blogs || [];
  fallbackLocaleBlogs.forEach(blog => {
    finalBlogMap.set(blog.data.permalink, blog);
  });
  primaryLocaleBlogs.forEach(blog => {
    finalBlogMap.set(blog.data.permalink, blog);
  });

  const finalBlogs = Array.from(finalBlogMap.values());
  const sortedBlogs = finalBlogs.sort((a, b) =>
    dayjs(b.data.createdAt).diff(dayjs(a.data.createdAt)),
  );

  return sortedBlogs;
}
