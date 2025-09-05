import React from 'react';

const Tooltip = ({ content, children }) => {
  return (
    <div className="relative group inline-block">
      {children}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2 py-1 rounded bg-gray-700 text-white text-xs whitespace-nowrap pointer-events-none">
        {content}
      </div>
    </div>
  );
};

export default Tooltip;
