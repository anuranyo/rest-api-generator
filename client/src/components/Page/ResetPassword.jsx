import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setMessage('');
      
      const response = await forgotPassword(email);
      setMessage(response.message || 'Password reset instructions have been sent to your email.');
      
      // Clear the form
      setEmail('');
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.message || 'Failed to send reset password email. Please try again.');
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
        <h1 className="text-3xl font-bold text-center mb-8">Reset Password</h1>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-white shadow-2xl p-8 rounded-2xl border"
        >
          <p className="text-gray-600 mb-4">
            Enter your email address and we will send you instructions to reset your password.
          </p>
          <input
            className="w-full border px-4 py-2 rounded-xl"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
              setMessage('');
            }}
            disabled={loading}
          />
          
          {error && <div className="text-red-600 text-sm font-semibold">{error}</div>}
          {message && <div className="text-green-600 text-sm font-semibold">{message}</div>}
          
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-xl hover:bg-indigo-700 transition"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Reset Password'}
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