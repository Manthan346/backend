import React from 'react';

const Input = ({ label, type = 'text', name, value, onChange, placeholder = '', required = false, error = '', className = '', ...props }) => {
  return (
    <div className="space-y-1">
      {label && <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label} {required && <span className="text-red-600">*</span>}</label>}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Input;
