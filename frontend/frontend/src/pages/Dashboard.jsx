import React, { useEffect, useState } from 'react';
import api from '../services/api';
import PerformanceCard from '../components/common/PerformanceCard';
import MarksGraph from '../components/common/MarksGraph';
import Card from '../components/common/Card';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    async function fetchData() {
      try {
        let response;
        if (user.role === 'student') {
          response = await api.get(`/dashboard/student/${user.id}`);
        } else {
          response = await api.get('/dashboard/stats');
        }
        setDashboardData(response.data);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user.role, user.id]);

  if (loading) {
    return <div className="text-center py-10">Loading dashboard data...</div>;
  }

  if (!dashboardData) {
    return <div className="text-center text-red-600">No data available.</div>;
  }

  // For students, show personal performance summary and marks graph
  if (user.role === 'student') {
    const stats = [
      { label: 'Total Tests', value: dashboardData.summary?.totalTests || 0 },
      { label: 'Average Score', value: `${dashboardData.summary?.averagePercentage?.toFixed(1) || 0}%` },
      { label: 'Highest Score', value: `${dashboardData.summary?.highestPercentage || 0}%` },
      { label: 'Tests Passed', value: `${dashboardData.summary?.passedTests || 0}/${dashboardData.summary?.totalTests || 0}` },
    ];

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map(({ label, value }) => (
            <PerformanceCard key={label} title={label} value={value} />
          ))}
        </div>
        <MarksGraph data={dashboardData.performances} />
      </div>
    );
  }

  // For admin/teacher, show more stats
  const stats = [
    { label: 'Total Students', value: dashboardData.totalStudents || 0 },
    { label: 'Total Tests', value: dashboardData.totalTests || 0 },
    { label: 'Total Subjects', value: dashboardData.totalSubjects || 0 },
    { label: 'Total Marks Entries', value: dashboardData.totalPerformances || 0 },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map(({ label, value }) => (
          <PerformanceCard key={label} title={label} value={value} />
        ))}
      </div>
      <Card title="Recent Activities">
        {/* You can add recent activities or charts here */}
        <div className="text-gray-500 text-center p-4">Dashboard analytics coming soon.</div>
      </Card>
    </div>
  );
};

export default Dashboard;
