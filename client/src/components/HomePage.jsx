import { motion } from 'framer-motion';

import Header from './Landing/Header';

export default function HomePage() {
  return (
    <motion.div
      className="min-h-screen bg-gray-50 text-gray-800 font-mono"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Header title="API Builder" />

      <main className="max-w-6xl mx-auto px-6 py-16 space-y-12">
        <section className="text-center">
          <h2 className="text-3xl font-extrabold mb-4">Welcome to your dashboard</h2>
          <p className="text-lg text-gray-600">
            Here you can manage your projects, generate new APIs, and explore endpoints.
          </p>
        </section>

        <section className="grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-xl shadow p-6 hover:shadow-xl transition">
            <h3 className="font-bold text-xl mb-2">📁 Your Projects</h3>
            <p className="text-sm text-gray-600">View and edit your existing API projects.</p>
            <a href="/projects" className="block mt-4 text-blue-600 hover:underline text-sm">Manage projects</a>
          </div>
          <div className="bg-white rounded-xl shadow p-6 hover:shadow-xl transition">
            <h3 className="font-bold text-xl mb-2">⚙️ Create New</h3>
            <p className="text-sm text-gray-600">Generate new API endpoints from schema.</p>
            <a href="/generate" className="block mt-4 text-blue-600 hover:underline text-sm">Start generating</a>
          </div>
          <div className="bg-white rounded-xl shadow p-6 hover:shadow-xl transition">
            <h3 className="font-bold text-xl mb-2">🧪 API Tester</h3>
            <p className="text-sm text-gray-600">Test endpoints with mock data instantly.</p>
            <a href="/sandbox" className="block mt-4 text-blue-600 hover:underline text-sm">Open sandbox</a>
          </div>
        </section>
      </main>

      <footer className="text-center text-xs text-gray-500 py-4 border-t">
        &copy; 2025 REST API Generator
      </footer>
    </motion.div>
  );
}
