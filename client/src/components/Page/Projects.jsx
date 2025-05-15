import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from "../Landing/Header";
import CreateProject from "../Page/CreateProject";
import { toast } from 'react-hot-toast';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Загрузка проектов при монтировании компонента
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/projects', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401 || response.status === 403) {
        // Token is invalid or expired
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error(error.message || 'Помилка завантаження проектів');
      
      if (error.message === 'No authentication token found') {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  // Обработчик успешного создания проекта
  const handleProjectCreated = (newProject) => {
    setProjects([newProject, ...projects]);
    setShowModal(false);
    toast.success('Проект успішно створено');
  };

  // Удаление проекта
  const handleDeleteProject = async (projectId) => {
    if (!confirm('Ви впевнені, що хочете видалити цей проект?')) return;

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Failed to delete project');
      }

      setProjects(projects.filter(p => p._id !== projectId));
      toast.success('Проект успішно видалено');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error(error.message || 'Помилка видалення проекту');
    }
  };

  // Handler for opening a project
  const handleOpenProject = (project) => {
    if (project.schemaId) {
      // If schema exists, navigate to project detail page (to be implemented)
      navigate(`/projects/${project._id}/view`);
    } else {
      // If no schema, navigate to API builder to create schema
      navigate(`/generate?projectId=${project._id}`);
    }
  };

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
          className="bg-blue-600 hover:bg-blue-700 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors"
        >
          +
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-[60vh]">
          <div className="text-gray-600">Завантаження...</div>
        </div>
      ) : (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
              {projects.map((project) => (
                <motion.div
                  key={project._id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {project.name}
                    </h3>
                    <button
                      onClick={() => handleDeleteProject(project._id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                  
                  {project.description && (
                    <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">API Prefix:</span>
                      <span className="font-mono text-gray-700">{project.apiPrefix}</span>
                    </div>
                    
                    {project.schemaId && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Schema:</span>
                        <span className="text-green-600">✓ Connected</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Created:</span>
                      <span className="text-gray-700">
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {project.endpoints?.length || 0} endpoints
                    </span>
                    <button
                      onClick={() => handleOpenProject(project)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Open →
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {showModal && (
        <CreateProject 
          onClose={() => setShowModal(false)}
          onProjectCreated={handleProjectCreated}
        />
      )}
    </div>
  );
}