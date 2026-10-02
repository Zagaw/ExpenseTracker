import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthCard from '../components/auth/AuthCard';
import Button from '../components/common/Button';
import TextField from '../components/common/TextField';
import { useAuth } from '../hooks/useAuth';
import { translatePhrase } from '../i18n';
import { getApiError } from '../utils/apiError';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};

    if (!email.trim()) {
      nextErrors.email = 'Email is required';
    }

    if (!password) {
      nextErrors.password = 'Password is required';
    }

    setErrors(nextErrors);
    setFormError('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      await login({ email: email.trim(), password });
      navigate(safeNextPath(location.state?.from), { replace: true });
    } catch (error) {
      const apiError = getApiError(error);
      setErrors(apiError.errors);
      setFormError(Object.keys(apiError.errors).length > 0 ? '' : apiError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      icon={LogIn}
      title="Welcome back"
      description="Sign in to track your money and review your spending."
      footer={
        <>
          {translatePhrase('New here?')}{' '}
          <Link
            to="/register"
            className="font-medium text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {translatePhrase('Create an account')}
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={errors.email}
          required
        />
        <TextField
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
          required
        />
        {formError ? (
          <p className="text-sm text-danger" role="alert">
            {translatePhrase(formError)}
          </p>
        ) : null}
        <Button type="submit" loading={loading}>
          Sign in
        </Button>
      </form>
    </AuthCard>
  );
}

function safeNextPath(from) {
  const path = from?.pathname;

  if (typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') && path !== '/login') {
    return path;
  }

  return '/dashboard';
}
