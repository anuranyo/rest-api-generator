// D:\Projects\rest-api-generator\client\src\components\Form\CreateTableModel.jsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';

export const CreateTableModel = ({ onClose, onCreateTable, errorMessage }) => {
  const [tableName, setTableName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (tableName.trim()) {
      onCreateTable(tableName.trim());
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl relative"
        initial={{ scale: 0.95, y: -20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: -20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-4 text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
        <h4 className="text-xs font-bold uppercase text-gray-400 mb-4">
          New Table
        </h4>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Table Name
            </label>
            <input
              type="text"
              placeholder="Example: users, products..."
              className="w-full border rounded-lg px-3 py-2 text-sm"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              required
            />
            {errorMessage && (
              <p className="text-red-500 text-xs mt-1">{errorMessage}</p>
            )}
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={onClose}
              className="text-sm px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="text-sm px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Create
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};