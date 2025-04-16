import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';

export default function LogIn() {
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, redirect to home
  if (currentUser) {
    return <Navigate to="/" />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = form;
  
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
  
    try {
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="max-w-md mx-auto my-20 font-mono">
        <h1 className="text-3xl font-bold text-center mb-8">Log In</h1>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-white shadow-2xl p-8 rounded-2xl border"
        >
          <input
            className="w-full border px-4 py-2 rounded-xl"
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            className="w-full border px-4 py-2 rounded-xl"
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            disabled={loading}
          />
          {error && <div className="text-red-600 text-sm font-semibold">{error}</div>}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-xl hover:bg-indigo-700 transition"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        <div className="text-center text-blue-600 mt-4 text-sm space-y-1">
          <a href="/reset" className="block hover:underline">Forgot password</a>
          <a href="/signup" className="block hover:underline">Sign Up</a>
        </div>
      </div>
    </motion.div>
  );
}