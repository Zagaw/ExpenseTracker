import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { createElement, memo } from 'react';
import { ChartColumn, PieChart as PieIcon, Scale } from 'lucide-react';
import { translatePhrase, useLanguage } from '../../i18n';
import { formatMoney } from '../../utils/currency';

const AXIS = { fill: 'var(--color-muted)', fontSize: 12 };
const TOOLTIP_STYLE = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  color: 'var(--color-ink)',
};

export default function DashboardCharts(props) {
  const language = useLanguage();
  return <ChartView {...props} language={language} />;
}

const ChartView = memo(function ChartView({ charts, language }) {
  const hasTrend = charts.spendingTrend.some((month) => month.amount > 0);
  const hasComparison = charts.incomeVsExpenses.some((month) => month.income > 0 || month.expenses > 0);

  return (
    <div className="mt-6 grid min-w-0 gap-3 lg:grid-cols-2" data-language={language}>
      <ChartCard icon={ChartColumn} title="Spending overview" description="Expenses over the last 6 months." className="lg:col-span-2">
        {hasTrend ? <SpendingTrend data={charts.spendingTrend} /> : <ChartEmpty message="No spending in the last 6 months." />}
      </ChartCard>
      <ChartCard icon={PieIcon} title="Spending by category" description="This month.">
        {charts.categories.length > 0 ? <CategoryBreakdown data={charts.categories} /> : <ChartEmpty message="No spending this month." />}
      </ChartCard>
      <ChartCard icon={Scale} title="Income vs expenses" description="The last 6 months.">
        {hasComparison ? <IncomeVsExpenses data={charts.incomeVsExpenses} /> : <ChartEmpty message="No income or expenses in the last 6 months." />}
      </ChartCard>
    </div>
  );
});

function SpendingTrend({ data }) {
  return (
    <>
      <div className="h-72 min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(value) => translatePhrase(String(value))} />
            <YAxis tick={AXIS} axisLine={false} tickLine={false} width={40} tickFormatter={compactAmount} />
            <Tooltip formatter={(value) => formatMoney(Number(value))} contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="amount" name={translatePhrase('Expenses')} fill="#0F766E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTable caption="Expenses over the last 6 months" rows={data.map((month) => [month.label, formatMoney(month.amount)])} />
    </>
  );
}

function CategoryBreakdown({ data }) {
  const chartData = data.map((entry) => ({ ...entry, name: translatePhrase(entry.name) }));

  return (
    <>
      <div className="h-72 min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={88}>
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatMoney(Number(value))} contentStyle={TOOLTIP_STYLE} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <DataTable caption="Spending by category this month" rows={data.map((category) => [category.name, formatMoney(category.amount)])} />
    </>
  );
}

function IncomeVsExpenses({ data }) {
  return (
    <>
      <div className="h-72 min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(value) => translatePhrase(String(value))} />
            <YAxis tick={AXIS} axisLine={false} tickLine={false} width={40} tickFormatter={compactAmount} />
            <Tooltip formatter={(value) => formatMoney(Number(value))} contentStyle={TOOLTIP_STYLE} />
            <Legend />
            <Bar dataKey="income" name={translatePhrase('Income')} fill="#15803D" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name={translatePhrase('Expenses')} fill="#0F766E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTable
        caption="Income and expenses over the last 6 months"
        rows={data.map((month) => [month.label, `Income ${formatMoney(month.income)}, expenses ${formatMoney(month.expenses)}`])}
      />
    </>
  );
}

function ChartCard({ icon, title, description, className = '', children }) {
  return (
    <section className={`min-w-0 overflow-hidden rounded-lg border border-border bg-surface p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-light text-primary">
          {createElement(icon, { className: 'size-4', 'aria-hidden': true })}
        </span>
        <div>
          <h2 className="text-base font-medium text-ink">{translatePhrase(title)}</h2>
          <p className="text-sm text-muted">{translatePhrase(description)}</p>
        </div>
      </div>
      <div className="mt-4 min-w-0">{children}</div>
    </section>
  );
}

function ChartEmpty({ message }) {
  return <p className="py-10 text-center text-sm text-muted">{translatePhrase(message)}</p>;
}

function DataTable({ caption, rows }) {
  return (
    <div className="sr-only">
      <p>{translatePhrase(caption)}</p>
      <ul>
        {rows.map((row) => (
          <li key={row[0]}>
            {translatePhrase(row[0])}
            {': '}
            {translatePhrase(row[1])}
          </li>
        ))}
      </ul>
    </div>
  );
}

function compactAmount(value) {
  if (value >= 1000000) {
    return `${Math.round(value / 1000000)}m`;
  }

  if (value >= 1000) {
    return `${Math.round(value / 1000)}k`;
  }

  return String(value);
}
