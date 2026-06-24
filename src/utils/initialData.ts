import { User, CarServiceOrder, ServiceItem } from '../types';
import { hashPassword } from './crypto';

// ──────────────────────────────────────────────────────────────
// Seed data.
// The ONLY pre-seeded account is the program analyst (Giorgi Imedashvili).
// This account is a hidden system user: it is never an owner, never appears
// in finances/salaries, and cannot be deleted. Everyone else (owner, managers,
// mechanics, shop staff, etc.) is created from inside the app.
// ──────────────────────────────────────────────────────────────

/** Username of the protected analyst/system account. */
export const ANALYST_USERNAME = 'imedo';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-analyst-1',
    firstName: 'გიორგი',
    lastName: 'იმედაშვილი',
    username: ANALYST_USERNAME,
    passwordHash: hashPassword('imed458'),
    role: 'developer',
    enabledModules: [],
    createdAt: '2026-01-01T09:00:00Z',
  },
];

// No demo orders / services — the database starts empty.
export const INITIAL_ORDERS: CarServiceOrder[] = [];
export const INITIAL_SERVICES: ServiceItem[] = [];
