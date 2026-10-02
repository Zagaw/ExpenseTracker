import { Bell, ChartColumn, CircleAlert, Repeat, TriangleAlert } from 'lucide-react';

const ICONS = {
  budget_warning: TriangleAlert,
  budget_exceeded: CircleAlert,
  recurring_reminder: Repeat,
  monthly_report: ChartColumn,
};

export function notificationIcon(type) {
  return ICONS[type] || Bell;
}
