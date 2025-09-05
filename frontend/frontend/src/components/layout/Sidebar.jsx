import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, Home, FileText, Settings } from 'lucide-react';

const Sidebar = () => {
  const [open, setOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  const links = [
    { label: 'Dashboard', to: '/dashboard', icon: Home },
    { label: 'Tests', to: '/tests', icon: FileText },
    ...(isAdmin ? [{ label: 'Admin', to: '/admin', icon: Settings }] : []),
  ];

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 p-2 bg-blue-600 rounded-md text-white md:hidden"
        aria-label="Toggle Menu"
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      <nav
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-md transform transition-transform z-40 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <div className="p-6 border-b border-gray-200 font-bold text-xl">
          Student Dashboard
        </div>
        <ul className="p-4 space-y-2">
          {links.map(({ label, to, icon: Icon }) => (
            <li key={label}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2 rounded-md ${
                    isActive
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
                onClick={() => setOpen(false)}
              >
                <Icon size={20} />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
