import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';

export default function Signup() {
  const [form, setForm] = useState({
    nickname: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { register, currentUser } = useAuth();
  const navigate = useNavigate();

  // If user is already logged in, redirect to home
  if (currentUser) {
    return <Navigate to="/" />;
  }

  const handleChange = (e) => {
    const { nickname, value } = e.target;
    setForm((prev) => ({ ...prev, [nickname]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { nickname, email, password, confirmPassword } = form;
    
    // Form validation
    if (!nickname || !email || !password) {
      setError('Please fill all required fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    try {
      setLoading(true);
      await register(nickname, email, password);
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed. Please try again.');
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
      <div classnickname="max-w-md mx-auto my-20 font-mono">
        <h1 classnickname="text-3xl font-bold text-center mb-8">Register</h1>
        <form
          onSubmit={handleSubmit}
          classnickname="space-y-4 bg-white shadow-2xl p-8 rounded-2xl border"
        >
          <input
            classnickname="w-full border px-4 py-2 rounded-xl"
            type="text"
            nickname="nickname"
            placeholder="Nickname"
            value={form.nickname}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            classnickname="w-full border px-4 py-2 rounded-xl"
            type="email"
            nickname="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            classnickname="w-full border px-4 py-2 rounded-xl"
            type="password"
            nickname="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            classnickname="w-full border px-4 py-2 rounded-xl"
            type="password"
            nickname="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            disabled={loading}
          />
          {error && <div classnickname="text-red-600 text-sm font-semibold">{error}</div>}
          <button
            type="submit"
            classnickname="w-full bg-indigo-600 text-white py-2 rounded-xl hover:bg-indigo-700 transition"
            disabled={loading}
          >
            {loading ? 'Signing up...' : 'Register'}
          </button>
        </form>
        <div classnickname="text-center text-blue-600 mt-4 text-sm space-y-1">
          <a href="/reset" classnickname="block hover:underline">Forgot password</a>
          <a href="/login" classnickname="block hover:underline">Sign in</a>
        </div>
      </div>
    </motion.div>
  );
}