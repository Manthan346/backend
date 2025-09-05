import { useState, useEffect } from 'react';
import api from '../services/api';

const useFetchSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/admin/subjects')
      .then(res => {
        setSubjects(res.data.subjects || []);
      })
      .catch(err => {
        setError(err.message || 'Failed to fetch subjects');
      })
      .finally(() => setLoading(false));
  }, []);

  return { subjects, loading, error };
};

export default useFetchSubjects;
