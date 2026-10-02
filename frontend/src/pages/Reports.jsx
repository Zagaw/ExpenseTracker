import { useEffect, useState } from 'react';
import { ChartColumn, CircleAlert } from 'lucide-react';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import SectionPage from '../components/common/SectionPage';
import SelectField from '../components/common/SelectField';
import TextField from '../components/common/TextField';
import ReportCharts from '../components/reports/ReportCharts';
import ReportSummary from '../components/reports/ReportSummary';
import { getReport } from '../services/reportApi';
import { translatePhrase } from '../i18n';
import { getApiError } from '../utils/apiError';

const PERIODS = [
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'this_year', label: 'This year' },
  { value: 'custom', label: 'Custom range' },
];

export default function Reports() {
  const [period, setPeriod] = useState('this_month');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState('loading');
  const [formError, setFormError] = useState('');
  const [requestId, setRequestId] = useState(0);
  const waitingForDates = period === 'custom' && (!from || !to);
  const dateOrderError = period === 'custom' && from && to && from > to;

  useEffect(() => {
    if (waitingForDates || dateOrderError) {
      return undefined;
    }

    let ignore = false;

    getReport(queryFor(period, from, to))
      .then((data) => {
        if (!ignore) {
          setReport(data);
          setFormError('');
          setStatus('ready');
        }
      })
      .catch((error) => {
        if (!ignore) {
          setFormError(getApiError(error).message);
          setStatus('error');
        }
      });

    return () => {
      ignore = true;
    };
  }, [period, from, to, requestId, waitingForDates, dateOrderError]);

  const hasActivity = report && (report.summary.income > 0 || report.summary.expenses > 0);

  function changePeriod(value) {
    setPeriod(value);
    setFormError('');
    setReport(null);

    if (value !== 'custom' || (from && to && from <= to)) {
      setStatus('loading');
    } else {
      setStatus('idle');
    }
  }

  function changeDate(setter, value) {
    setter(value);
    setFormError('');
    setReport(null);
    const nextFrom = setter === setFrom ? value : from;
    const nextTo = setter === setTo ? value : to;

    if (nextFrom && nextTo && nextFrom <= nextTo) {
      setStatus('loading');
    } else {
      setStatus('idle');
    }
  }

  return (
    <SectionPage
      icon={ChartColumn}
      title="Reports"
      description="Compare income, expenses, and categories over time."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SelectField id="report-period" label="Period" value={period} onChange={(event) => changePeriod(event.target.value)}>
          {PERIODS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </SelectField>
        {period === 'custom' ? (
          <>
            <TextField
              id="report-from"
              label="Start date"
              type="date"
              value={from}
              onChange={(event) => changeDate(setFrom, event.target.value)}
            />
            <TextField
              id="report-to"
              label="End date"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => changeDate(setTo, event.target.value)}
              error={dateOrderError ? 'End date must be on or after the start date' : ''}
            />
          </>
        ) : null}
      </div>

      {waitingForDates ? (
        <div className="mt-6">
          <EmptyState
            icon={ChartColumn}
            title="Choose a date range"
            description="Pick a start and end date to see income, expenses, and categories."
          />
        </div>
      ) : null}
      {status === 'loading' && !waitingForDates && !dateOrderError ? <ReportSkeleton /> : null}
      {status === 'error' ? (
        <div className="mt-6">
          <EmptyState
            icon={CircleAlert}
            title="Unable to load this report"
            description={formError || 'Check your connection and try again.'}
          >
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
      {status === 'ready' && report && hasActivity ? (
        <>
          <p className="mt-6 text-sm text-muted">{translatePhrase(report.period.label)}</p>
          <ReportSummary summary={report.summary} />
          <ReportCharts report={report} />
        </>
      ) : null}
      {status === 'ready' && report && !hasActivity ? (
        <div className="mt-6">
          <EmptyState
            icon={ChartColumn}
            title="Not enough data yet"
            description="Add a few transactions to see your spending trends."
          />
        </div>
      ) : null}
    </SectionPage>
  );
}

function queryFor(period, from, to) {
  const now = new Date();

  if (period === 'this_year') {
    return { year: now.getUTCFullYear() };
  }

  if (period === 'last_month') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    return { month: start.getUTCMonth() + 1, year: start.getUTCFullYear() };
  }

  if (period === 'custom') {
    return { date_from: from, date_to: to };
  }

  return { month: now.getUTCMonth() + 1, year: now.getUTCFullYear() };
}

function ReportSkeleton() {
  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="h-28 animate-pulse rounded-lg border border-border bg-surface" />
      ))}
    </div>
  );
}
