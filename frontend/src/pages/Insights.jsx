import { useEffect, useState } from 'react';
import { CircleAlert, Lightbulb } from 'lucide-react';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import SectionPage from '../components/common/SectionPage';
import InsightCard from '../components/insights/InsightCard';
import { getInsights } from '../services/insightApi';

export default function Insights() {
  const [insights, setInsights] = useState([]);
  const [status, setStatus] = useState('loading');
  const [requestId, setRequestId] = useState(0);

  useEffect(() => {
    let ignore = false;

    getInsights()
      .then((items) => {
        if (!ignore) {
          setInsights(items);
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

  return (
    <SectionPage
      icon={Lightbulb}
      title="Insights"
      description="Plain-language notes about your records. These describe what happened and are not financial advice."
    >
      {status === 'loading' ? (
        <div className="grid gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-lg border border-border bg-surface" />
          ))}
        </div>
      ) : null}
      {status === 'error' ? (
        <EmptyState icon={CircleAlert} title="Unable to load your insights" description="Check your connection and try again.">
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
      ) : null}
      {status === 'ready' && insights.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="No insights yet"
          description="Add a few transactions to see notes about your spending."
        />
      ) : null}
      {status === 'ready' && insights.length > 0 ? (
        <div className="grid gap-3">
          {insights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      ) : null}
    </SectionPage>
  );
}
