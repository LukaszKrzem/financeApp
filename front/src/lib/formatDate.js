import { format, parseISO } from 'date-fns';

const toDate = (dateValue) => {
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'string') return parseISO(dateValue);
  return new Date(dateValue);
};

export const formatDate = (dateValue, locale = 'pl-PL', options = {}) => {
  if (!dateValue) return '';
  const date = toDate(dateValue);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale, options);
};

export const formatTime = (
  dateValue,
  locale = 'pl-PL',
  options = { hour: '2-digit', minute: '2-digit' }
) => {
  if (!dateValue) return '';
  const date = toDate(dateValue);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(locale, options);
};

export const formatDateTime = (dateValue, locale = 'pl-PL') => {
  if (!dateValue) return '';
  const timeStr = formatTime(dateValue, locale);
  const dateStr = formatDate(dateValue, locale);
  if (!timeStr || !dateStr) return '';
  return `${timeStr} - ${dateStr}`;
};

export const formatDatePattern = (dateValue, pattern = 'PPP') => {
  if (!dateValue) return '';
  const date = toDate(dateValue);
  if (isNaN(date.getTime())) return '';
  return format(date, pattern);
};
