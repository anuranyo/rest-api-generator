import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Header from '../Landing/Header';

export default function ProjectView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [previewFiles, setPreviewFiles] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [generatedData, setGeneratedData] = useState(null);

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project');
      }

      const projectData = await response.json();
      setProject(projectData);

      // Parse schema if available
      if (projectData.schemaId?.content) {
        const parsedSchema = JSON.parse(projectData.schemaId.content);
        setSchema(parsedSchema);
      }
    } catch (error) {
      console.error('Error fetching project:', error);
      toast.error('Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const generateAPI = async () => {
    if (!project.schemaId) {
      toast.error('No schema found for this project');
      return;
    }

    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/generator/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schemaId: project.schemaId._id,
          dbType: 'mongodb',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate API');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-${project.name}-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('API generated successfully!');
    } catch (error) {
      console.error('Error generating API:', error);
      toast.error(error.message || 'Failed to generate API');
    } finally {
      setGenerating(false);
    }
  };

  const previewAPI = async () => {
    if (!project.schemaId) {
      toast.error('No schema found for this project');
      return;
    }

    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/generator/preview', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schemaId: project.schemaId._id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to preview API');
      }

      const data = await response.json();
      setPreviewFiles(data.files);
      
      // Select first file by default
      const firstFile = Object.keys(data.files)[0];
      setSelectedFile(firstFile);
    } catch (error) {
      console.error('Error previewing API:', error);
      toast.error('Failed to preview API');
    } finally {
      setGenerating(false);
    }
  };

  const generateTestData = async () => {
    if (!project.schemaId) {
      toast.error('No schema found for this project');
      return;
    }

    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/generator/generate-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schemaId: project.schemaId._id,
          count: 5,
          locale: 'en',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate test data');
      }

      const data = await response.json();
      setGeneratedData(data.data);
      toast.success('Test data generated successfully!');
    } catch (error) {
      console.error('Error generating test data:', error);
      toast.error('Failed to generate test data');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-gray-600">Project not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto p-6 mt-16">
        {/* Project Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
              {project.description && (
                <p className="text-gray-600 mt-2">{project.description}</p>
              )}
              <div className="mt-4 space-y-1 text-sm text-gray-500">
                <div>API Prefix: <span className="font-mono">{project.apiPrefix}</span></div>
                <div>Created: {new Date(project.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/generate?projectId=${project._id}`)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Edit Schema
              </button>
              <button
                onClick={() => navigate('/projects')}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                Back to Projects
              </button>
            </div>
          </div>
        </div>

        {/* Schema Overview */}
        {schema && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Database Schema</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schema.tables.map((table, index) => (
                <motion.div
                  key={table.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border rounded-lg p-4"
                >
                  <h3 className="font-semibold text-gray-800 mb-2">{table.name}</h3>
                  <div className="text-sm text-gray-600">
                    <div>{table.columns.length} columns</div>
                    <div className="mt-2 space-y-1">
                      {table.columns.slice(0, 3).map(column => (
                        <div key={column.name} className="font-mono text-xs">
                          {column.name}: {column.faker?.category}.{column.faker?.type}
                        </div>
                      ))}
                      {table.columns.length > 3 && (
                        <div className="text-xs text-gray-500">
                          ... and {table.columns.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Generate API</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={generateAPI}
              disabled={generating || !project.schemaId}
              className={`px-6 py-3 rounded-lg text-white font-medium transition-colors ${
                generating || !project.schemaId
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {generating ? 'Generating...' : 'Generate & Download API'}
            </button>
            
            <button
              onClick={previewAPI}
              disabled={generating || !project.schemaId}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                generating || !project.schemaId
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Preview Generated Files
            </button>
            
            <button
              onClick={generateTestData}
              disabled={generating || !project.schemaId}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                generating || !project.schemaId
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Generate Test Data
            </button>
          </div>
          
          {!project.schemaId && (
            <p className="mt-4 text-sm text-red-600">
              Please create a schema first before generating the API.
            </p>
          )}
        </div>

        {/* File Preview */}
        {previewFiles && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Generated Files Preview</h2>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1">
                <h3 className="font-medium text-gray-700 mb-2">Files</h3>
                <div className="space-y-1">
                  {Object.keys(previewFiles).map(fileName => (
                    <button
                      key={fileName}
                      onClick={() => setSelectedFile(fileName)}
                      className={`w-full text-left px-3 py-2 rounded text-sm ${
                        selectedFile === fileName
                          ? 'bg-blue-100 text-blue-700'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {fileName}
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-span-3">
                <h3 className="font-medium text-gray-700 mb-2">
                  {selectedFile}
                </h3>
                {selectedFile && (
                  <pre className="bg-gray-100 p-4 rounded overflow-x-auto text-xs">
                    <code>{previewFiles[selectedFile]}</code>
                  </pre>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Test Data Preview */}
        {generatedData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Generated Test Data</h2>
            <div className="space-y-4">
              {Object.entries(generatedData).map(([tableName, data]) => (
                <div key={tableName}>
                  <h3 className="font-medium text-gray-700 mb-2">{tableName}</h3>
                  <div className="bg-gray-100 p-4 rounded overflow-x-auto">
                    <pre className="text-xs">
                      <code>{JSON.stringify(data, null, 2)}</code>
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}