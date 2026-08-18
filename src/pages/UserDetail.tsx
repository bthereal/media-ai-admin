import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useAuth } from '../contexts/AuthContext'
import { canViewUser } from '../lib/permissions'
import { ROLE_CATALOG } from '../lib/roleCatalog'
import { deactivateUser, fetchUser, reactivateUser, updateUser, type UserListItem } from '../services/userApi'
import './Users.css'

interface FormState {
  firstName: string
  lastName: string
  email: string
  password: string
  role: string
}

export default function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const isAdmin = currentUser?.roles.includes('ROLE_GROUP_ADMIN') ?? false
  const canAccess = canViewUser(currentUser, id ?? null)

  const [target, setTarget] = useState<UserListItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [working, setWorking] = useState(false)

  const [form, setForm] = useState<FormState>({ firstName: '', lastName: '', email: '', password: '', role: 'editor' })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id || !canAccess) {
      setLoading(false)
      return
    }
    let cancelled = false
    fetchUser(id).then(data => {
      if (cancelled) return
      if (data) {
        setTarget(data)
        setForm({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: '',
          role: data.roles.includes('ROLE_GROUP_ADMIN') ? 'admin' : 'editor',
        })
      } else {
        setError(true)
      }
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [id, canAccess])

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm(f => ({ ...f, [field]: e.target.value }))
      setFieldErrors(fe => ({ ...fe, [field]: '' }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!target) return
    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    setFieldErrors({})

    const result = await updateUser(target.id, {
      email: form.email.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      ...(form.password ? { password: form.password } : {}),
      ...(isAdmin ? { role: form.role } : {}),
    })

    setSaving(false)

    if ('ok' in result) {
      if (result.errors) {
        setFieldErrors(result.errors)
      } else {
        setSaveError(result.error)
      }
      return
    }

    setTarget(result)
    setForm(f => ({ ...f, password: '' }))
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2500)
  }

  async function handleToggle() {
    if (!id || !target) return
    setWorking(true)
    const updated = target.deactivatedAt === null ? await deactivateUser(id) : await reactivateUser(id)
    setWorking(false)
    if (updated) {
      setTarget(updated)
    }
  }

  if (!canAccess) {
    return <p className="media-error">You can only view your own account.</p>
  }

  if (loading) return <p className="media-loading">Loading…</p>
  if (error || !target) return <p className="media-error">User not found.</p>

  const isActive = target.deactivatedAt === null
  const isSelf = currentUser?.id === target.id
  const isAdminRole = target.roles.includes('ROLE_GROUP_ADMIN')

  return (
    <div className="users-page">
      <div className="users-page-header">
        <h1>{target.firstName} {target.lastName}</h1>
        <button type="button" className="btn-ghost" onClick={() => void navigate(isAdmin ? '/users' : '/')}>
          ← Back
        </button>
      </div>

      <form className="user-detail-form" onSubmit={e => void handleSubmit(e)} noValidate>
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
          label="New password"
          type="password"
          value={form.password}
          onChange={set('password')}
          error={fieldErrors.password}
          hint="Leave blank to keep the current password"
          autoComplete="new-password"
        />

        <div className="form-field">
          <label className="form-label" htmlFor={isAdmin ? 'role' : undefined}>Role</label>
          {isAdmin ? (
            <select id="role" className="form-input" value={form.role} onChange={set('role')}>
              {ROLE_CATALOG.map(role => (
                <option key={role.key} value={role.key}>{role.label}</option>
              ))}
            </select>
          ) : (
            <span className={`badge ${isAdminRole ? 'badge-category' : 'badge-pending'}`}>
              {isAdminRole ? 'Admin' : 'Editor'}
            </span>
          )}
          {fieldErrors.role && <p className="form-error" role="alert">{fieldErrors.role}</p>}
        </div>

        <div className="user-detail-fields">
          <div className="user-detail-field">
            <span className="user-detail-label">Status</span>
            <span className={`badge ${isActive ? 'badge-success' : 'badge-error'}`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="user-detail-field">
            <span className="user-detail-label">Created</span>
            <span>{new Date(target.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {saveError && <p className="form-error" role="alert">{saveError}</p>}
        {saveSuccess && <p className="form-success" role="status">Saved.</p>}

        <div className="user-detail-actions">
          {isAdmin && !isSelf && (
            <button
              type="button"
              className={isActive ? 'btn-delete' : 'btn-primary'}
              onClick={() => void handleToggle()}
              disabled={working}
            >
              {working ? 'Working…' : isActive ? 'Deactivate' : 'Reactivate'}
            </button>
          )}
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
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
