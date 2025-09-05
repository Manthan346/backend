import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import { Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import MarksEntryModal from './MarksEntryModal';

const TestsPage = () => {
  const [tests, setTests] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showTestModal, setShowTestModal] = useState(false);
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [editingTest, setEditingTest] = useState(null);

  const [form, setForm] = useState({
    title: '',
    subject: '',
    testType: 'quiz',
    maxMarks: '',
    passingMarks: '',
    testDate: ''
  });

  useEffect(() => {
    fetchTests();
    fetchSubjects();
  }, []);

  const fetchTests = async () => {
    try {
      const res = await api.get('/tests');
      setTests(res.data.tests || []);
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/admin/subjects');
      setSubjects(res.data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const openCreateModal = () => {
    setEditingTest(null);
    setForm({
      title: '',
      subject: '',
      testType: 'quiz',
      maxMarks: '',
      passingMarks: '',
      testDate: ''
    });
    setShowTestModal(true);
  };

  const openEditModal = test => {
    setEditingTest(test);
    setForm({
      title: test.title,
      subject: test.subject._id,
      testType: test.testType,
      maxMarks: test.maxMarks,
      passingMarks: test.passingMarks,
      testDate: test.testDate.split('T')[0]
    });
    setShowTestModal(true);
  };

  const closeTestModal = () => {
    setShowTestModal(false);
    setEditingTest(null);
  };

  const submitTest = async e => {
    e.preventDefault();
    try {
      if (editingTest) {
        await api.put(`/tests/${editingTest._id}`, form);
      } else {
        await api.post('/tests', form);
      }
      fetchTests();
      closeTestModal();
    } catch (error) {
      console.error('Error saving test:', error);
    }
  };

  const deleteTest = async id => {
    if (!window.confirm('Are you sure you want to delete this test?')) return;
    try {
      await api.delete(`/tests/${id}`);
      fetchTests();
    } catch (error) {
      console.error('Error deleting test:', error);
    }
  };

  const openMarksModalHandler = test => {
    setSelectedTest(test);
    setShowMarksModal(true);
  };

  const closeMarksModal = () => {
    setSelectedTest(null);
    setShowMarksModal(false);
  };

  if (loading) return <div className="text-center py-6">Loading tests...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Test Management</h2>
        <Button onClick={openCreateModal} className="flex items-center gap-2">
          <Plus size={16} /> Create Test
        </Button>
      </div>

      <div>
        {tests.length === 0 ? (
          <Card>No tests available.</Card>
        ) : (
          tests.map(test => (
            <Card key={test._id} className="flex justify-between items-center p-4 mb-3">
              <div>
                <h3 className="text-lg font-semibold">{test.title}</h3>
                <p className="text-sm text-gray-600">
                  Subject: {test.subject?.name} | Type: {test.testType} | Date: {new Date(test.testDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openMarksModalHandler(test)} className="flex items-center gap-1">
                  <CheckCircle size={16} /> Marks
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEditModal(test)}>
                  <Edit size={16} />
                </Button>
                <Button variant="danger" size="sm" onClick={() => deleteTest(test._id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={showTestModal} onClose={closeTestModal} title={editingTest ? 'Edit Test' : 'Create New Test'}>
        <form onSubmit={submitTest} className="space-y-4">
          <Input
            label="Title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Test title"
            required
          />
          <label className="block text-sm font-medium text-gray-700">Subject</label>
          <select name="subject" value={form.subject} onChange={handleChange} required className="w-full border border-gray-300 rounded-md px-3 py-2">
            <option value="">Select Subject</option>
            {subjects.map(sub => (
              <option key={sub._id} value={sub._id}>
                {sub.name}
              </option>
            ))}
          </select>

          <label className="block text-sm font-medium text-gray-700 mt-2">Test Type</label>
          <select name="testType" value={form.testType} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" required>
            <option value="quiz">Quiz</option>
            <option value="midterm">Midterm</option>
            <option value="final">Final</option>
            <option value="assignment">Assignment</option>
          </select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Maximum Marks"
              name="maxMarks"
              type="number"
              value={form.maxMarks}
              onChange={handleChange}
              placeholder="100"
              required
            />
            <Input
              label="Passing Marks"
              name="passingMarks"
              type="number"
              value={form.passingMarks}
              onChange={handleChange}
              placeholder="40"
              required
            />
          </div>

          <Input
            label="Test Date"
            name="testDate"
            type="date"
            value={form.testDate}
            onChange={handleChange}
            required
          />
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {editingTest ? 'Update' : 'Create'} Test
            </Button>
            <Button variant="outline" onClick={closeTestModal} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {showMarksModal && selectedTest && (
        <MarksEntryModal
          test={selectedTest}
          isOpen={showMarksModal}
          onClose={closeMarksModal}
        />
      )}
    </div>
  );
};

export default TestsPage;
