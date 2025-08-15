import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FiUser, FiMapPin, FiClock, FiChevronRight } from 'react-icons/fi';

const UserSettings = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  // Update active tab based on current route
  React.useEffect(() => {
    const path = location.pathname;
    if (path.includes('profile')) setActiveTab('profile');
    else if (path.includes('addresses')) setActiveTab('addresses');
    else if (path.includes('orders')) setActiveTab('orders');
  }, [location]);

  const tabs = [
    {
      id: 'profile',
      icon: <FiUser className="mr-3 h-5 w-5 text-gray-500 group-hover:text-gray-500 group-focus:text-gray-600" />,
      name: 'Profile',
      description: 'Update your profile information',
      path: '/settings/profile'
    },
    {
      id: 'addresses',
      icon: <FiMapPin className="mr-3 h-5 w-5 text-gray-500 group-hover:text-gray-500 group-focus:text-gray-600" />,
      name: 'Addresses',
      description: 'Manage your delivery addresses',
      path: '/settings/addresses'
    },
    {
      id: 'orders',
      icon: <FiClock className="mr-3 h-5 w-5 text-gray-500 group-hover:text-gray-500 group-focus:text-gray-600" />,
      name: 'Order History',
      description: 'View your past orders',
      path: '/settings/orders'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Account Settings
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Manage your account information and preferences
          </p>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Your Account</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Mobile navigation */}
          <div className="sm:hidden">
            <div className="border-t border-gray-200">
              <ul className="divide-y divide-gray-200">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      onClick={() => navigate(tab.path)}
                      className={`w-full px-4 py-4 flex items-center justify-between text-sm font-medium ${
                        activeTab === tab.id
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        {tab.icon}
                        <span>{tab.name}</span>
                      </div>
                      <FiChevronRight className="h-5 w-5 text-gray-400" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-12">
            {/* Desktop navigation */}
            <aside className="hidden sm:block sm:col-span-3 border-r border-gray-200">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => navigate(tab.path)}
                    className={`w-full text-left px-6 py-4 flex items-center text-sm font-medium ${
                      activeTab === tab.id
                        ? 'bg-blue-50 border-blue-500 text-blue-700 hover:bg-blue-50 hover:text-blue-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } border-l-4`}
                  >
                    {tab.icon}
                    <span className="truncate">{tab.name}</span>
                  </button>
                ))}
              </nav>
            </aside>

            {/* Main content area */}
            <div className="sm:col-span-9">
              <div className="px-4 py-5 sm:p-6">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;