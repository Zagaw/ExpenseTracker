import { Banknote, CircleUser, Mail, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageIcon from '../components/common/PageIcon';
import SectionPage from '../components/common/SectionPage';
import { translatePhrase } from '../i18n';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { user } = useAuth();

  return (
    <SectionPage
      icon={CircleUser}
      title="Profile"
      description="The name, email, and currency saved with this account."
      action={(
        <Link to="/settings" className="inline-flex h-10 items-center text-sm font-medium text-primary">
          {translatePhrase('Edit in settings')}
        </Link>
      )}
    >
      <dl className="grid gap-4 sm:grid-cols-2">
        <ProfileItem icon={User} label="Name" value={user.fullName} />
        <ProfileItem icon={Mail} label="Email" value={user.email} />
        <ProfileItem icon={Banknote} label="Currency" value={user.currency} />
      </dl>
    </SectionPage>
  );
}

function ProfileItem({ icon, label, value }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <PageIcon icon={icon} />
        <div>
          <dt className="text-sm text-muted">{translatePhrase(label)}</dt>
          <dd className="mt-1 text-sm font-medium text-ink">{value}</dd>
        </div>
      </div>
    </div>
  );
}
