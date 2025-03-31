import { motion } from 'framer-motion';
import { useState } from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setEmail(e.target.value);
    setError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setSubmitted(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <div className="max-w-md mx-auto my-20 font-mono">
        <h1 className="text-3xl font-bold text-center mb-8">Forgot Password</h1>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-white shadow-2xl p-8 rounded-2xl border"
        >
          <input
            className="w-full border px-4 py-2 rounded-xl"
            type="email"
            name="email"
            placeholder="Enter your email"
            value={email}
            onChange={handleChange}
          />
          {error && <div className="text-red-600 text-sm font-semibold">{error}</div>}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 rounded-xl hover:bg-indigo-700 transition"
          >
            Reset Password
          </button>
        </form>
        {submitted && (
          <div className="mt-4 text-center text-green-600 text-sm">
            A reset link has been sent to your email.
          </div>
        )}
        <div className="text-center text-blue-600 mt-4 text-sm">
          <a href="/login" className="hover:underline">Back to login</a>
        </div>
      </div>
    </motion.div>
  );
}
