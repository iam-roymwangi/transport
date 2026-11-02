export const LOCATIONS = ['Westend', 'Delta', 'Riverside', 'Two Rivers'];

export const ROUTES = [
  'Jogoo Road',
  'Thika Road',
  'Ngong Road',
  'Mombasa Road',
  'Waiyaki Way',
  'Lower Kabete',
  'Kiambu Road',
  'Kamiti Road',
  'Limuru Road',
];

export const PROCESSES = [
  'BT',
  'wynZ',
  'BD',
  'BT Safety',
  'Vinted',
  'Caption Call',
];

export const STAFF_ROLES = [
  'Agent',
  'Supervisor',
  'QA',
  'IT',
  'OAM',
  'OM',
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_INFO: Record<
  StaffRole,
  { label: string; description: string; badgeColor: string }
> = {
  Agent: {
    label: 'Agent',
    description: 'Frontline Customer Operations & Support',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  Supervisor: {
    label: 'Supervisor',
    description: 'Team Supervision & Operations Leadership',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  QA: {
    label: 'QA',
    description: 'Quality Assurance & Performance Auditing',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  IT: {
    label: 'IT',
    description: 'Information Technology & Systems Support',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  OAM: {
    label: 'OAM',
    description: 'Operations Account Manager / Area Lead',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  OM: {
    label: 'OM',
    description: 'Operations Manager',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
};

// Default configurable shifts per role
export const DEFAULT_ROLE_SHIFTS: Record<
  StaffRole,
  Array<{ name: string; shift: string; isOvernight?: boolean }>
> = {
  Agent: [
    { name: 'Evening Shift (Flexible)', shift: '17:00 - 02:00', isOvernight: true },
    { name: 'Midday Shift', shift: '12:00 - 21:00' },
    { name: 'Afternoon Shift', shift: '13:00 - 21:30/22:00' },
    { name: 'Late Afternoon', shift: '14:30/15:00 - 00:00', isOvernight: true },
    { name: 'Twilight Shift', shift: '16:00 - 01:00', isOvernight: true },
    { name: 'Night Shift', shift: '18:00 - 03:00', isOvernight: true },
    { name: 'Graveyard Shift', shift: '20:00 - 05:00', isOvernight: true },
    { name: 'Overnight Shift', shift: '23:00 - 08:00', isOvernight: true },
  ],
  Supervisor: [
    { name: 'Morning Supervision', shift: '08:00 - 17:00' },
    { name: 'Day Supervision', shift: '10:00 - 19:00' },
    { name: 'Late Shift Oversight', shift: '16:00 - 01:00', isOvernight: true },
    { name: 'Evening Supervision', shift: '17:00 - 02:00', isOvernight: true },
    { name: 'Night Supervision', shift: '23:00 - 08:00', isOvernight: true },
  ],
  QA: [
    { name: 'Standard QA Shift', shift: '09:00 - 18:00' },
    { name: 'Mid QA Shift', shift: '13:00 - 22:00' },
    { name: 'Late QA Monitoring', shift: '17:00 - 02:00', isOvernight: true },
  ],
  IT: [
    { name: 'Early IT Support', shift: '07:00 - 16:00' },
    { name: 'Day IT Support', shift: '09:00 - 18:00' },
    { name: 'Swing IT Support', shift: '15:00 - 00:00', isOvernight: true },
    { name: 'Night IT Systems', shift: '23:00 - 08:00', isOvernight: true },
  ],
  OAM: [
    { name: 'Core Management', shift: '08:00 - 17:00' },
    { name: 'Partner Operations', shift: '10:00 - 19:00' },
    { name: 'Executive Late', shift: '14:00 - 23:00' },
  ],
  OM: [
    { name: 'General Operations', shift: '08:00 - 17:00' },
    { name: 'Strategic Oversight', shift: '09:00 - 18:00' },
    { name: 'Floor Oversight', shift: '12:00 - 21:00' },
  ],
};

// Global / generic fallback shifts list
export const SHIFTS = [
  '17:00 - 02:00',
  '12:00 - 21:00',
  '13:00 - 21:30/22:00',
  '13:30/14:00 - 23:00',
  '14:30/15:00 - 00:00',
  '15:30 - 00:30',
  '16:00 - 01:00',
  '16:30 - 01:30',
  '16:30/17:00 - 02:00',
  '18:00 - 03:00',
  '18:30/19:00 - 04:00',
  '20:00 - 05:00',
  '21:00 - 06:00',
  '21:30/22:00 - 07:00',
  '23:00 - 08:00',
  '00:00 - 09:00',
];
