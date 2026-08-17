import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ROLE_CATALOG } from '../lib/roleCatalog'
import { createUser } from '../services/userApi'
import './CreateUser.css'

interface FormState {
  email: string
  password: string
  firstName: string
  lastName: string
  role: string
}

const EMPTY: FormState = { email: '', password: '', firstName: '', lastName: '', role: 'editor' }

export default function CreateUser() {
  const { token } = useAuth()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(f => ({ ...f, [field]: e.target.value }))
      setFieldErrors(fe => ({ ...fe, [field]: '' }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setFieldErrors({})
    setLoading(true)

    const result = await createUser(form, token ?? '')
    setLoading(false)

    if (result.ok) {
      setSuccess(`User ${result.email} created successfully.`)
      setForm(EMPTY)
    } else if (result.errors) {
      setFieldErrors(result.errors)
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="create-user-page">
      <h1>Create User</h1>

      <form className="create-user-form" onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <Field
            id="firstName"
            label="First name"
            value={form.firstName}
            onChange={set('firstName')}
            error={fieldErrors.firstName}
            autoComplete="given-name"
          />
          <Field
            id="lastName"
            label="Last name"
            value={form.lastName}
            onChange={set('lastName')}
            error={fieldErrors.lastName}
            autoComplete="family-name"
          />
        </div>

        <Field
          id="email"
          label="Email address"
          type="email"
          value={form.email}
          onChange={set('email')}
          error={fieldErrors.email}
          autoComplete="off"
        />

        <Field
          id="password"
          label="Password"
          type="password"
          value={form.password}
          onChange={set('password')}
          error={fieldErrors.password}
          hint="Minimum 8 characters"
          autoComplete="new-password"
        />

        <div className="form-field">
          <label htmlFor="role" className="form-label">Role</label>
          <select id="role" className="form-input" value={form.role} onChange={set('role')}>
            {ROLE_CATALOG.map(role => (
              <option key={role.key} value={role.key}>{role.label}</option>
            ))}
          </select>
          <p className="form-hint">
            {ROLE_CATALOG.find(role => role.key === form.role)?.description}
          </p>
          {fieldErrors.role && <p className="form-error" role="alert">{fieldErrors.role}</p>}
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}
        {success && <p className="form-success" role="status">{success}</p>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creating…' : 'Create user'}
        </button>
      </form>
    </div>
  )
}

interface FieldProps {
  id: string
  label: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  hint?: string
  type?: string
  autoComplete?: string
}

function Field({ id, label, value, onChange, error, hint, type = 'text', autoComplete }: FieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={id} className="form-label">{label}</label>
      <input
        id={id}
        type={type}
        className={`form-input${error ? ' form-input-error' : ''}`}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
      />
      {hint && !error && <p className="form-hint">{hint}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
    </div>
  )
}
