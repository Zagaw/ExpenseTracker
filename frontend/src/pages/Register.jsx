import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AuthCard from '../components/auth/AuthCard';
import Button from '../components/common/Button';
import TextField from '../components/common/TextField';
import { useAuth } from '../hooks/useAuth';
import { translatePhrase } from '../i18n';
import { getApiError } from '../utils/apiError';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};

    if (!fullName.trim()) {
      nextErrors.fullName = 'Name is required';
    }

    if (!email.trim()) {
      nextErrors.email = 'Email is required';
    }

    if (!password) {
      nextErrors.password = 'Password is required';
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(nextErrors);
    setFormError('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setLoading(true);

    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
      });
      navigate('/dashboard', { replace: true });
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
      icon={UserPlus}
      title="Create your account"
      description="Start with a secure login. Your expenses stay private to you."
      footer={
        <>
          {translatePhrase('Already have an account?')}{' '}
          <Link
            to="/login"
            className="font-medium text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {translatePhrase('Sign in')}
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <TextField
          id="fullName"
          label="Name"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          error={errors.fullName}
          required
        />
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
          autoComplete="new-password"
          hint="At least 8 characters."
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
          Create account
        </Button>
      </form>
    </AuthCard>
  );
}
