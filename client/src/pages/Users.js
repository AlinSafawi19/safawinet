import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiUsers, HiShieldCheck, HiUserAdd } from 'react-icons/hi';
import authService from '../services/authService';

const Users = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  const hasPermission = (page, action) => {
    if (!currentUser) return false;
    return authService.hasPermission(page, action);
  };

  const canViewUsers = hasPermission('users', 'view');
  const canCreateUsers = hasPermission('users', 'add');

  if (!canViewUsers) {
    return (
      <div className="users-page">
        <div className="users-header">
          <h1>Users</h1>
        </div>
        <div className="access-denied">
          <HiShieldCheck />
          <h2>Access Denied</h2>
          <p>You don't have permission to view users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <div className="header-content">
          <h1 className="page-title">
            <HiUsers /> Users
          </h1>
          <p className="page-description">
            Manage system users and their permissions
          </p>
        </div>
        {canCreateUsers && (
          <button
            className="btn btn-primary"
            onClick={() => navigate('/users/create')}
          >
            <HiUserAdd />
            Create User
          </button>
        )}
      </div>
    </div>
  );
};

export default Users;
