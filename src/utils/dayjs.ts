import _dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/en';
import 'dayjs/locale/zh-cn';
import type { AppLocale } from '../i18n/utils';
// 扩展 dayjs 插件
_dayjs.extend(utc);
_dayjs.extend(timezone);
_dayjs.locale('zh-cn');

const format = 'YYYY-MM-DD HH:mm dddd';
const localeMap: Record<AppLocale, string> = {
  zh: 'zh-cn',
  en: 'en',
};

const dayjs = (time: string, locale: AppLocale = 'zh') =>
  _dayjs(time).utcOffset(8).locale(localeMap[locale]);

export { format, dayjs };
