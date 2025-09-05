import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Button from '../common/Button';

const MarksEntryModal = ({ test, isOpen, onClose }) => {
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchStudents();
    }
  }, [isOpen]);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data.students || []);
      setMarks(
        (res.data.students || []).map(student => ({
          studentId: student._id,
          marksObtained: '',
          remarks: ''
        }))
      );
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarksChange = (studentId, field, value) => {
    setMarks(prev =>
      prev.map(mark =>
        mark.studentId === studentId ? { ...mark, [field]: value } : mark
      )
    );
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const marksToSubmit = marks.filter(m => m.marksObtained !== '');
      await api.post(`/tests/${test._id}/marks`, { marks: marksToSubmit });
      onClose();
    } catch (err) {
      console.error('Error submitting marks:', err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Enter Marks for: ${test.title}`} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="mb-2 text-sm text-gray-700">
          Maximum Marks: {test.maxMarks} | Passing Marks: {test.passingMarks}
        </div>

        {loading ? (
          <div className="text-center py-8">Loading students...</div>
        ) : (
          students.map(student => {
            const studentMark = marks.find(m => m.studentId === student._id) || {};
            return (
              <div key={student._id} className="flex items-center gap-4 mb-2">
                <div className="flex-1 font-medium">{student.name}</div>
                <Input
                  type="number"
                  className="w-20"
                  placeholder="Marks"
                  min="0"
                  max={test.maxMarks}
                  value={studentMark.marksObtained || ''}
                  onChange={e => handleMarksChange(student._id, 'marksObtained', e.target.value)}
                />
                <Input
                  placeholder="Remarks"
                  className="w-40"
                  value={studentMark.remarks || ''}
                  onChange={e => handleMarksChange(student._id, 'remarks', e.target.value)}
                />
              </div>
            );
          })
        )}

        <div className="flex gap-3 pt-4">
          <Button type="submit" className="flex-1">
            Submit Marks
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default MarksEntryModal;
