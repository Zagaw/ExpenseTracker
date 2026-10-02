import { useEffect, useState } from 'react';
import { CircleAlert, LayoutDashboard, Lightbulb, PiggyBank } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import PageIcon from '../components/common/PageIcon';
import EmptyState from '../components/common/EmptyState';
import BudgetProgressCard from '../components/budgets/BudgetProgressCard';
import InsightCard from '../components/insights/InsightCard';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import SummaryCards from '../components/dashboard/SummaryCards';
import { translatePhrase } from '../i18n';
import { useAuth } from '../hooks/useAuth';
import { getDashboard } from '../services/dashboardApi';

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [status, setStatus] = useState('loading');
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let ignore = false;

    getDashboard()
      .then((data) => {
        if (!ignore) {
          setDashboard(data);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!ignore) {
          setStatus('error');
        }
      });

    return () => {
      ignore = true;
    };
  }, [requestId]);

  const hasMoney = dashboard && (dashboard.summary.totalIncome > 0 || dashboard.summary.totalExpenses > 0);
  const hasBudgets = dashboard && dashboard.budgets.length > 0;
  const insights = dashboard?.insights || [];

  return (
    <section className="min-w-0">
      <div className="flex items-start gap-3">
        <PageIcon icon={LayoutDashboard} className="mt-1" />
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight">
            {translatePhrase(greeting(user.fullName))}
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">{translatePhrase('Here\'s your financial overview.')}</p>
        </div>
      </div>
      {status === 'loading' ? <DashboardSkeleton /> : null}
      {status === 'ready' && (hasMoney || hasBudgets) ? <SummaryCards summary={dashboard.summary} /> : null}
      {status === 'ready' && hasMoney ? <DashboardCharts charts={dashboard.charts} /> : null}
      {status === 'ready' && (hasMoney || hasBudgets) ? (
        <section className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <PageIcon icon={PiggyBank} />
              <h2 className="text-base font-medium text-ink">{translatePhrase('Budget progress')}</h2>
            </div>
            <Link to="/budgets" className="text-sm font-medium text-primary">{translatePhrase('View budgets')}</Link>
          </div>
          {hasBudgets ? (
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {dashboard.budgets.map((budget) => (
                <BudgetProgressCard key={budget.id} budget={budget} />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">{translatePhrase('No budgets this month.')}</p>
          )}
        </section>
      ) : null}
      {status === 'ready' && insights.length > 0 ? (
        <section className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <PageIcon icon={Lightbulb} />
              <h2 className="text-base font-medium text-ink">{translatePhrase('Insights')}</h2>
            </div>
            <Link to="/insights" className="text-sm font-medium text-primary">{translatePhrase('View insights')}</Link>
          </div>
          <div className="mt-3 grid gap-3">
            {insights.slice(0, 3).map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </section>
      ) : null}
      {status === 'ready' && hasMoney ? <RecentTransactions transactions={dashboard.transactions} /> : null}
      {status === 'ready' && !hasMoney && !hasBudgets ? (
        <div className="mt-6">
          <EmptyState
            icon={LayoutDashboard}
            title="Nothing to summarize yet"
            description="Your balance, spending, and recent activity will show up here after you record income or expenses."
          />
        </div>
      ) : null}
      {status === 'error' ? (
        <div className="mt-6">
          <EmptyState icon={CircleAlert} title="Unable to load your financial overview" description="Check your connection and try again.">
            <Button
              type="button"
              fullWidth={false}
              onClick={() => {
                setStatus('loading');
                setRequestId((value) => value + 1);
              }}
            >
              Try again
            </Button>
          </EmptyState>
        </div>
      ) : null}
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="h-24 animate-pulse rounded-lg border border-border bg-surface" />
      ))}
    </div>
  );
}

function greeting(name) {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return `${part}, ${name}`;
}
