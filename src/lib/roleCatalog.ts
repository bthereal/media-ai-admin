export interface RoleOption {
  key: 'admin' | 'editor'
  label: string
  description: string
}

// Mirrors the backend's canonical src/Security/RoleCatalog.php — keep in sync.
export const ROLE_CATALOG: RoleOption[] = [
  { key: 'admin', label: 'Admin', description: 'Full access, including creating other users.' },
  { key: 'editor', label: 'Editor', description: 'Can create, edit, and manage content and playlists.' },
]
