import {
  CalendarDays,
  ChartColumn,
  CircleAlert,
  CircleCheck,
  Lightbulb,
  PiggyBank,
  Receipt,
  Scale,
  Tags,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
} from 'lucide-react';

export const INSIGHT_ICONS = {
  spending_increase: TrendingUp,
  spending_decrease: TrendingDown,
  budget_warning: TriangleAlert,
  budget_exceeded: CircleAlert,
  budget_usage: PiggyBank,
  largest_category: Tags,
  second_category: ChartColumn,
  daily_spending: CalendarDays,
  healthy_balance: CircleCheck,
  expenses_higher: Scale,
  even_balance: Scale,
  unusual_expense: Receipt,
};

export function insightIcon(type) {
  return INSIGHT_ICONS[type] || Lightbulb;
}
