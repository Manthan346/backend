import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';

const TeacherManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await api.get('/admin/teachers');
      setTeachers(res.data.teachers || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Additional create/update/delete functions and modals would be implemented here

  if (loading) return <div>Loading teachers...</div>;

  return (
    <div>
      <Button className="mb-4">Add Teacher</Button>
      {teachers.length === 0 ? (
        <Card>No teachers found.</Card>
      ) : (
        <div className="space-y-3">
          {teachers.map((teacher) => (
            <Card key={teacher._id}>
              <p><strong>Name:</strong> {teacher.name}</p>
              <p><strong>Email:</strong> {teacher.email}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherManagement;
