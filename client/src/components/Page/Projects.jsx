import { motion } from 'framer-motion';
import { useState } from 'react';
import Header from "../Landing/Header";
import CreateProject from "../Form/CreateProject";

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-mono relative">
      <Header />

      <div className="flex space-x-2 items-center mb-8 mt-16">
        <div className="text-xl text-gray-800 font-semibold">Projects</div>
        <div className="text-xl text-gray-800 font-semibold">
          <span className="text-gray-400">/</span>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md"
        >
          +
        </button>
      </div>

      <motion.div
        className="flex justify-center items-center h-[60vh] text-gray-600"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {projects.length === 0 ? (
          <div className="text-center text-2xl flex items-center gap-2">
            <span className="text-2xl text-gray-400">🔍</span>
            No projects yet...
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Future: Render project cards here */}
          </div>
        )}
      </motion.div>

      {showModal && <CreateProject onClose={() => setShowModal(false)} />}
    </div>
  );
}
