import React from 'react';

const PerformanceCard = ({ title, value, icon, color = 'bg-blue-500' }) => {
  return (
    <div className={`flex items-center p-4 rounded-lg shadow-sm ${color} text-white`}>
      {icon && <div className="mr-4">{icon}</div>}
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
};

export default PerformanceCard;
