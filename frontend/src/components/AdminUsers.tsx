import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Settings, Trash2, Edit3, ShieldAlert, Check } from 'lucide-react';

export const AdminUsers = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ role: '', penaltyPoints: 0 });

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

  useEffect(() => {
    loadUsers();
  }, []);

  const handleEdit = (u: any) => {
    setEditingId(u._id);
    setEditForm({ role: u.role, penaltyPoints: u.penaltyPoints || 0 });
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
    if (!window.confirm(`Are you sure you want to delete user ${name}? This action cannot be undone.`)) return;
    try {
      await api.deleteUser(id);
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

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
          <h1 className="dashboard-title">User <span className="gradient-text">Management</span></h1>
          <p className="dashboard-subtitle">Manage library members, librarians, and administrative access.</p>
        </div>
        <div className="glass-card" style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--primary-light)', color: 'var(--primary)', margin: 0, border: 'none' }}>
          <Settings size={18} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Admin Portal</span>
        </div>
      </header>

      {error && (
        <div style={{ background: 'var(--status-overdue-bg)', color: 'var(--status-overdue)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px solid rgba(239, 71, 111, 0.2)' }}>
          {error}
        </div>
      )}

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Penalty Points</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No users found.</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '4px' }}>ID: {u._id}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    
                    <td>
                      {editingId === u._id ? (
                        <select
                          className="form-control"
                          style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                          value={editForm.role}
                          onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                        >
                          <option value="MEMBER">MEMBER</option>
                          <option value="LIBRARIAN">LIBRARIAN</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      ) : (
                        <span className={`status-badge ${
                          u.role === 'ADMIN' ? 'status-overdue' : 
                          u.role === 'LIBRARIAN' ? 'status-active' : 
                          'status-returned'
                        }`}>
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
                          style={{ width: '80px', padding: '6px 10px', fontSize: '0.85rem' }}
                          value={editForm.penaltyPoints}
                          onChange={(e) => setEditForm(prev => ({ ...prev, penaltyPoints: parseInt(e.target.value) || 0 }))}
                        />
                      ) : (
                        <span style={{ fontWeight: 600, color: u.penaltyPoints > 0 ? 'var(--status-overdue)' : 'var(--text-primary)' }}>
                          {u.penaltyPoints || 0}
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      {editingId === u._id ? (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button onClick={() => setEditingId(null)} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Cancel</button>
                          <button onClick={() => handleSave(u._id)} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                            <Check size={14} /> Save
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem' }}>
                          <button onClick={() => handleEdit(u)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)' }} title="Edit User">
                            <Edit3 size={18} />
                          </button>
                          {user.id !== u._id && (
                            <button onClick={() => handleDelete(u._id, u.name)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--status-overdue)' }} title="Delete User">
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
