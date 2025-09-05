import { useState, useEffect } from 'react';
import api from '../services/api';

const useFetchStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/students')
      .then(res => {
        setStudents(res.data.students || []);
      })
      .catch(err => {
        setError(err.message || 'Failed to fetch students');
      })
      .finally(() => setLoading(false));
  }, []);

  return { students, loading, error };
};

export default useFetchStudents;
