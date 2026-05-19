import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', email: '' });
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await usersAPI.getAll();
      setUsers(res.data);
    } catch (err) {
      if (err.response?.status === 429) setError('Rate limit exceeded. Please wait.');
      else setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await usersAPI.update(editId, form);
      } else {
        await usersAPI.create(form);
      }
      setShowForm(false);
      setEditId(null);
      setForm({ name: '', email: '' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (user) => {
    setForm({ name: user.name, email: user.email });
    setEditId(user.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await usersAPI.delete(id);
      fetchUsers();
    } catch (err) {
      setError('Delete failed');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary-500"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-500 text-sm mt-1">Manage system users</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', email: '' }); }}
          className="btn-primary text-sm">
          {showForm ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}

      {showForm && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">{editId ? 'Edit User' : 'New User'}</h3>
          <form onSubmit={handleSubmit} className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-500 mb-1">Name</label>
              <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-500 mb-1">Email</label>
              <input className="input-field" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <button type="submit" className="btn-primary text-sm">{editId ? 'Update' : 'Create'}</button>
          </form>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="table-header text-left py-3 px-6">ID</th>
              <th className="table-header text-left py-3 px-6">Name</th>
              <th className="table-header text-left py-3 px-6">Email</th>
              <th className="table-header text-left py-3 px-6">Role</th>
              <th className="table-header text-left py-3 px-6">Created</th>
              <th className="table-header text-right py-3 px-6">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className="py-3 px-6 text-gray-400">#{user.id}</td>
                <td className="py-3 px-6 text-white font-medium">{user.name}</td>
                <td className="py-3 px-6 text-gray-300">{user.email}</td>
                <td className="py-3 px-6"><span className="badge badge-info">{user.roleId === 1 ? 'ADMIN' : 'USER'}</span></td>
                <td className="py-3 px-6 text-gray-500 text-xs">{user.createdAt?.split('T')[0]}</td>
                <td className="py-3 px-6 text-right space-x-2">
                  <button onClick={() => handleEdit(user)} className="text-primary-400 hover:text-primary-300 text-xs font-medium">Edit</button>
                  <button onClick={() => handleDelete(user.id)} className="text-red-400 hover:text-red-300 text-xs font-medium">Delete</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center text-gray-600">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
