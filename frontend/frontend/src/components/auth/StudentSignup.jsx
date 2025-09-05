import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services//api';
import Input from '../common/Input';
import Button from '../common/Button';
import Card from '../common/Card';

const StudentSignup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    rollNo: '',
    class: '',
    section: '',
    dateOfBirth: '',
    guardianName: '',
    guardianPhone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/students/signup', form);
      navigate('/', { state: { message: 'Account created successfully. Please login.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900">Create Student Account</h2>
            {error && <div className="mt-2 text-red-600">{error}</div>}
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange}
                required
              />
              <Input
                label="Email"
                type="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                name="password"
                placeholder="Create a password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <Input
                label="Roll Number"
                name="rollNo"
                placeholder="Enter roll number"
                value={form.rollNo}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Input
                label="Class"
                name="class"
                placeholder="e.g. 10"
                value={form.class}
                onChange={handleChange}
                required
              />
              <Input
                label="Section"
                name="section"
                placeholder="e.g. A"
                value={form.section}
                onChange={handleChange}
                required
              />
              <Input
                label="Date of Birth"
                type="date"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Guardian Name"
                name="guardianName"
                placeholder="Parent/Guardian name"
                value={form.guardianName}
                onChange={handleChange}
                required
              />
              <Input
                label="Guardian Phone"
                type="tel"
                name="guardianPhone"
                placeholder="Guardian phone number"
                value={form.guardianPhone}
                onChange={handleChange}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm">
            Already have an account?{' '}
            <Link to="/" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign in here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StudentSignup;
