import React from 'react';
import Button from '../common/Button';
import { LogOut } from 'lucide-react';

const Header = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <header className="flex justify-between items-center bg-white shadow px-6 py-4 border-b border-gray-200">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Welcome, {user.name}</h1>
        <p className="text-sm text-gray-600 capitalize">{user.role}</p>
      </div>

      <Button variant="outline" size="sm" onClick={logout} className="flex items-center gap-2">
        <LogOut size={16} /> Logout
      </Button>
    </header>
  );
};

export default Header;
