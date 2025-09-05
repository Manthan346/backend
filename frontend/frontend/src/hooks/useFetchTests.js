import { useState, useEffect } from 'react';
import api from '../services/api';

const useFetchTests = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/tests')
      .then(res => {
        setTests(res.data.tests || []);
      })
      .catch(err => {
        setError(err.message || 'Failed to fetch tests');
      })
      .finally(() => setLoading(false));
  }, []);

  return { tests, loading, error };
};

export default useFetchTests;
