import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Settings, Trash2, Edit3, ShieldAlert, Check, Search, Users, Shield, BookOpen, AlertTriangle, X } from 'lucide-react';

export const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', role: '', penaltyPoints: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleEdit = (u: any) => {
    setEditingId(u._id);
    setEditForm({ name: u.name, role: u.role, penaltyPoints: u.penaltyPoints || 0 });
  };

  const handleSave = async (id: string) => {
    try {
      await api.updateUser(id, editForm);
      setEditingId(null);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) return;
    try {
      await api.deleteUser(id);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = !searchQuery ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = !roleFilter || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    librarians: users.filter(u => u.role === 'LIBRARIAN').length,
    members: users.filter(u => u.role === 'MEMBER').length,
    flagged: users.filter(u => (u.penaltyPoints || 0) >= 3).length,
  }), [users]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="glass-card" style={{ padding: '4rem', textAlign: 'center' }}>
        <ShieldAlert style={{ width: '4rem', height: '4rem', color: 'var(--status-overdue)', margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)' }}>You must be an Administrator to view this page.</p>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="dashboard-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={36} color="var(--primary)" />
            User <span className="gradient-text">Management</span>
          </h1>
          <p className="dashboard-subtitle">Manage library members, librarians, and administrative access.</p>
        </div>
        <div className="glass-card" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary-light)', color: 'var(--primary)', margin: 0, border: 'none' }}>
          <Settings size={18} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Admin Portal</span>
        </div>
      </header>

      {/* Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Users', value: stats.total, icon: <Users size={20} />, color: 'var(--primary)', bg: 'var(--primary-light)' },
          { label: 'Admins', value: stats.admins, icon: <Shield size={20} />, color: '#A78BFA', bg: 'rgba(167,139,250,0.1)' },
          { label: 'Librarians', value: stats.librarians, icon: <BookOpen size={20} />, color: 'var(--status-active)', bg: 'var(--status-active-bg)' },
          { label: 'Members', value: stats.members, icon: <Users size={20} />, color: 'var(--status-returned)', bg: 'var(--status-returned-bg)' },
          { label: 'Restricted', value: stats.flagged, icon: <AlertTriangle size={20} />, color: 'var(--status-overdue)', bg: 'var(--status-overdue-bg)' },
        ].map(s => (
          <div key={s.label} className="glass-card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', margin: 0, border: 'none', background: '#fff' }}>
            <div style={{ width: 40, height: 40, borderRadius: '12px', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: '1 1 250px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="form-control"
            style={{ paddingLeft: '42px', width: '100%' }}
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['', 'ADMIN', 'LIBRARIAN', 'MEMBER'].map(role => (
            <button
              key={role}
              className={`btn ${roleFilter === role ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: 'var(--radius-pill)' }}
              onClick={() => setRoleFilter(role)}
            >
              {role || 'All'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px solid rgba(239, 71, 111, 0.2)' }}>
          {error}
        </div>
      )}

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Showing {filteredUsers.length} of {users.length} users
          </span>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '1.5rem' }}>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Penalty Points</th>
                <th>Status</th>
                <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading users...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No users found matching your criteria.</td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isRestricted = (u.penaltyPoints || 0) >= 3;
                  return (
                    <tr key={u._id} style={{ background: editingId === u._id ? 'var(--primary-light)' : '#fff', transition: 'background 0.2s' }}>
                      <td style={{ paddingLeft: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '1rem', flexShrink: 0,
                            background: u.role === 'ADMIN' ? 'rgba(167,139,250,0.15)' : u.role === 'LIBRARIAN' ? 'var(--status-active-bg)' : 'var(--status-returned-bg)',
                            color: u.role === 'ADMIN' ? '#A78BFA' : u.role === 'LIBRARIAN' ? 'var(--status-active)' : 'var(--status-returned)'
                          }}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            {editingId === u._id ? (
                              <input className="form-control" style={{ padding: '4px 8px', fontSize: '0.85rem', width: '140px' }} value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} />
                            ) : (
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{u.name}</div>
                            )}
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '2px' }}>ID: {u._id.substring(0, 10)}...</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{u.email}</td>

                      <td>
                        {editingId === u._id ? (
                          <select
                            className="form-control"
                            style={{ padding: '4px 8px', fontSize: '0.85rem', width: '120px' }}
                            value={editForm.role}
                            onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                          >
                            <option value="MEMBER">MEMBER</option>
                            <option value="LIBRARIAN">LIBRARIAN</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        ) : (
                          <span className={`badge ${
                            u.role === 'ADMIN' ? 'status-overdue' :
                            u.role === 'LIBRARIAN' ? 'status-active' :
                            'status-returned'
                          }`} style={{ fontWeight: 700 }}>
                            {u.role}
                          </span>
                        )}
                      </td>

                      <td>
                        {editingId === u._id ? (
                          <input
                            type="number"
                            min="0"
                            className="form-control"
                            style={{ width: '70px', padding: '4px 8px', fontSize: '0.85rem' }}
                            value={editForm.penaltyPoints}
                            onChange={(e) => setEditForm(prev => ({ ...prev, penaltyPoints: parseInt(e.target.value) || 0 }))}
                          />
                        ) : (
                          <span style={{
                            fontWeight: 700, fontSize: '1.1rem',
                            color: isRestricted ? 'var(--status-overdue)' : (u.penaltyPoints || 0) > 0 ? '#F59E0B' : 'var(--text-primary)'
                          }}>
                            {u.penaltyPoints || 0}
                          </span>
                        )}
                      </td>

                      <td>
                        {isRestricted ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--status-overdue)', color: '#fff', fontSize: '0.7rem', fontWeight: 800 }}>
                            <AlertTriangle size={12} /> RESTRICTED
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: 'var(--status-returned-bg)', color: 'var(--status-returned)', fontSize: '0.7rem', fontWeight: 800 }}>
                            ACTIVE
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                        {editingId === u._id ? (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button onClick={() => setEditingId(null)} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-pill)' }}>
                              <X size={14} /> Cancel
                            </button>
                            <button onClick={() => handleSave(u._id)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 'var(--radius-pill)' }}>
                              <Check size={14} /> Save
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button onClick={() => handleEdit(u)} className="btn btn-outline" style={{ padding: '6px 10px', borderRadius: '10px', border: '1px solid var(--border)' }} title="Edit User">
                              <Edit3 size={16} />
                            </button>
                            {user.id !== u._id && (
                              <button onClick={() => handleDelete(u._id, u.name)} className="btn btn-outline" style={{ padding: '6px 10px', borderRadius: '10px', borderColor: 'var(--status-overdue-bg)', color: 'var(--status-overdue)' }} title="Delete User">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
