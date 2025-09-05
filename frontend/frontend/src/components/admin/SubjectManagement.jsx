import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';

const SubjectManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/admin/subjects');
      setSubjects(res.data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Additional create/update/delete functions and modals would be implemented here

  if (loading) return <div>Loading subjects...</div>;

  return (
    <div>
      <Button className="mb-4">Add Subject</Button>
      {subjects.length === 0 ? (
        <Card>No subjects found.</Card>
      ) : (
        <div className="space-y-3">
          {subjects.map((subject) => (
            <Card key={subject._id}>
              <p><strong>Name:</strong> {subject.name}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubjectManagement;
