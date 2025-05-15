import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function CreateProject({ onClose, onProjectCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    apiPrefix: '/api/v1',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Очистка ошибки при изменении поля
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Назва проекту обов\'язкова';
    } else if (formData.name.length < 3 || formData.name.length > 50) {
      newErrors.name = 'Назва повинна бути від 3 до 50 символів';
    }
    
    if (formData.apiPrefix && !formData.apiPrefix.startsWith('/')) {
      newErrors.apiPrefix = 'Префікс API повинен починатися з /';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      
      if (!response.ok) {
        if (data.errors) {
          // Обработка ошибок валидации
          const newErrors = {};
          data.errors.forEach(error => {
            newErrors[error.path || error.param] = error.msg;
          });
          setErrors(newErrors);
        } else {
          throw new Error(data.message || 'Failed to create project');
        }
        return;
      }
      
      // Успешное создание
      onProjectCreated(data.project);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(error.message || 'Помилка створення проекту');
      
      if (error.message === 'No authentication token found') {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl relative"
        initial={{ scale: 0.95, y: -20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          disabled={loading}
        >
          ✕
        </button>
        <h4 className="text-xs font-bold uppercase text-gray-400 mb-4">
          New Project
        </h4>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Example: Todo App, Project X..."
              className={`w-full border rounded-lg px-3 py-2 text-sm ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={loading}
            />
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of your project..."
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              API Prefix
            </label>
            <input
              type="text"
              name="apiPrefix"
              value={formData.apiPrefix}
              onChange={handleChange}
              placeholder="Example: /api/v1"
              className={`w-full border rounded-lg px-3 py-2 text-sm ${
                errors.apiPrefix ? 'border-red-500' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              disabled={loading}
            />
            {errors.apiPrefix && (
              <p className="text-xs text-red-500 mt-1">{errors.apiPrefix}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Add API prefix to all endpoints in this project.
            </p>
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`text-sm px-6 py-2 rounded-lg text-white transition-colors ${
                loading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}