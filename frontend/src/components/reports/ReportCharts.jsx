import { createElement, memo } from 'react';
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
import { ChartColumn, PieChart as PieIcon, Scale } from 'lucide-react';
import CategoryIcon from '../categories/CategoryIcon';
import { formatMoney } from '../../utils/currency';
import { useLanguage, translatePhrase } from '../../i18n';

const AXIS = { fill: 'var(--color-muted)', fontSize: 12 };
const TOOLTIP_STYLE = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  color: 'var(--color-ink)',
};

export default function ReportCharts(props) {
  const language = useLanguage();
  return <ChartView {...props} language={language} />;
}

const ChartView = memo(function ChartView({ report, language }) {
  const grainText = report.grain === 'day' ? 'Each day in this period.' : 'Each month in this period.';
  const hasTrend = report.spendingTrend.some((point) => point.amount > 0);
  const hasComparison = report.incomeVsExpenses.some((point) => point.income > 0 || point.expenses > 0);

  return (
    <div className="mt-6 grid min-w-0 gap-3 lg:grid-cols-2" data-language={language}>
      <ChartCard
        icon={ChartColumn}
        title="Monthly expense trend"
        description={grainText}
        className="lg:col-span-2"
      >
        {hasTrend ? <SpendingTrend data={report.spendingTrend} /> : <ChartEmpty message="No spending in this period." />}
      </ChartCard>
      <ChartCard icon={PieIcon} title="Category breakdown" description="Where the spending went.">
        {report.categories.length > 0 ? <CategoryBreakdown data={report.categories} /> : <ChartEmpty message="No spending in this period." />}
      </ChartCard>
      <ChartCard icon={Scale} title="Income vs expenses" description={grainText}>
        {hasComparison ? <IncomeVsExpenses data={report.incomeVsExpenses} /> : <ChartEmpty message="No income or expenses in this period." />}
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
            <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} interval="preserveStartEnd" tickFormatter={(value) => translatePhrase(String(value))} />
            <YAxis tick={AXIS} axisLine={false} tickLine={false} width={40} tickFormatter={compactAmount} />
            <Tooltip formatter={(value) => formatMoney(Number(value))} contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="amount" name={translatePhrase('Expenses')} fill="#0F766E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataList caption="Expenses in this period" rows={data.map((point) => [point.label, formatMoney(point.amount)])} />
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
      <ul className="mt-2 space-y-2">
        {data.map((category) => (
          <li key={category.name} className="flex items-center gap-3">
            <CategoryIcon name={category.icon} color={category.color} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">{translatePhrase(category.name)}</p>
              <p className="text-sm text-muted">
                {translatePhrase(`${category.count} ${category.count === 1 ? 'expense' : 'expenses'}`)}
                {' · '}
                {category.percentage}%
              </p>
            </div>
            <p className="text-sm font-medium text-ink">{formatMoney(category.amount)}</p>
          </li>
        ))}
      </ul>
      <DataList caption="Spending by category" rows={data.map((category) => [category.name, `${formatMoney(category.amount)}, ${category.percentage}%`])} />
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
            <XAxis dataKey="label" tick={AXIS} axisLine={false} tickLine={false} interval="preserveStartEnd" tickFormatter={(value) => translatePhrase(String(value))} />
            <YAxis tick={AXIS} axisLine={false} tickLine={false} width={40} tickFormatter={compactAmount} />
            <Tooltip formatter={(value) => formatMoney(Number(value))} contentStyle={TOOLTIP_STYLE} />
            <Legend />
            <Bar dataKey="income" name={translatePhrase('Income')} fill="#15803D" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name={translatePhrase('Expenses')} fill="#0F766E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataList
        caption="Income and expenses in this period"
        rows={data.map((point) => [point.label, `Income ${formatMoney(point.income)}, expenses ${formatMoney(point.expenses)}`])}
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

function DataList({ caption, rows }) {
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
