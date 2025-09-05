import React, { useState } from 'react';
import TeacherManagement from './TeacherManagement';
import SubjectManagement from './SubjectManagement';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('teachers');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Admin Panel</h2>
      <div className="flex border-b border-gray-200 mb-4">
        <button
          className={`px-4 py-2 border-b-2 -mb-px ${
            activeTab === 'teachers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('teachers')}
        >
          Teachers
        </button>
        <button
          className={`px-4 py-2 border-b-2 -mb-px ${
            activeTab === 'subjects' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
          onClick={() => setActiveTab('subjects')}
        >
          Subjects
        </button>
      </div>

      {activeTab === 'teachers' && <TeacherManagement />}
      {activeTab === 'subjects' && <SubjectManagement />}
    </div>
  );
};

export default Admin;
