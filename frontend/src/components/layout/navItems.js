import {
  Bell,
  ChartColumn,
  CircleUser,
  LayoutDashboard,
  Lightbulb,
  PiggyBank,
  Receipt,
  Repeat,
  Settings,
  Tags,
  Wallet,
} from 'lucide-react';

export const primaryNav = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
];

export const transactionNav = [
  { label: 'Expenses', to: '/expenses', icon: Receipt },
  { label: 'Income', to: '/income', icon: Wallet },
  { label: 'Categories', to: '/categories', icon: Tags },
];

export const planningNav = [
  { label: 'Budgets', to: '/budgets', icon: PiggyBank },
  { label: 'Recurring', to: '/recurring-expenses', icon: Repeat },
  { label: 'Reports', to: '/reports', icon: ChartColumn },
  { label: 'Insights', to: '/insights', icon: Lightbulb },
  { label: 'Notifications', to: '/notifications', icon: Bell },
];

export const accountNav = [
  { label: 'Settings', to: '/settings', icon: Settings },
  { label: 'Profile', to: '/profile', icon: CircleUser },
];

export const mobileNav = [
  { label: 'Home', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Expenses', to: '/expenses', icon: Receipt },
  { label: 'Budgets', to: '/budgets', icon: PiggyBank },
  { label: 'Reports', to: '/reports', icon: ChartColumn },
];
