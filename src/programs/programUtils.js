export const PROGRAM_FREQUENCY_OPTIONS = [
  { id: 'one-time', label: 'One-time' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

export const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export function formatProgramFrequencyLabel(value) {
  if (!value) {
    return PROGRAM_FREQUENCY_OPTIONS[0]?.label ?? 'One-time';
  }
  const option = PROGRAM_FREQUENCY_OPTIONS.find(item => item.id === value);
  if (option) {
    return option.label;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function createProgramItemId() {
  return `program-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createVerseId() {
  const timestamp = Date.now();
  return `verse-${timestamp}-${Math.random().toString(36).slice(2, 8)}`;
}
