import _dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import zh from 'dayjs/locale/zh-cn';
// 扩展 dayjs 插件
_dayjs.extend(utc);
_dayjs.extend(timezone);
_dayjs.locale(zh);

const format = 'YYYY-MM-DD HH:mm dddd';
const dayjs = (time: string) => _dayjs(time).utcOffset(8);

export { format, dayjs };
