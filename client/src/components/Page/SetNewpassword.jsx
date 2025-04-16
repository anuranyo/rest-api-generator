import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

export default function SetNewPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const { token } = useParams();

  useEffect(() => {
    // Check that a token was provided
    if (!token) {
      setError('Invalid or missing reset token');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setMessage('');
      
      const response = await resetPassword(token, password);
      setMessage(response.message || 'Your password has been reset successfully.');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Set new password error:', err);
      setError(err.message || 'Failed to reset password. The token may be invalid or expired.');
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
        <h1 className="text-3xl font-bold text-center mb-8">Set New Password</h1>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-white shadow-2xl p-8 rounded-2xl border"
        >
          <input
            className="w-full border px-4 py-2 rounded-xl"
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            disabled={loading || !token}
          />
          <input
            className="w-full border px-4 py-2 rounded-xl"
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError('');
            }}
            disabled={loading || !token}
          />
          
          {error && <div className="text-red-600 text-sm font-semibold">{error}</div>}
          {message && <div className="text-green-600 text-sm font-semibold">{message}</div>}
          
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-xl hover:bg-indigo-700 transition"
            disabled={loading || !token}
          >
            {loading ? 'Setting new password...' : 'Set New Password'}
          </button>
        </form>
        <div className="text-center text-blue-600 mt-4 text-sm space-y-1">
          <button 
            onClick={() => navigate('/login')} 
            className="block mx-auto hover:underline"
          >
            Back to Login
          </button>
        </div>
      </div>
    </motion.div>
  );
}