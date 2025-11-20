import { useAuth } from '../contexts/AuthContext';
import { useCallback } from 'react';
import type { UserRole } from '../types/moderation';
import { hasMinimumRole, canActOnRole as checkCanActOnRole } from '../utils/permissions';

export function usePermissions() {
  const { userRole, permissions, isStaff } = useAuth();

  const hasRole = useCallback((requiredRole: UserRole) => {
    return hasMinimumRole(userRole, requiredRole);
  }, [userRole]);

  const canActOnRole = useCallback((targetRole: UserRole) => {
    return checkCanActOnRole(userRole, targetRole);
  }, [userRole]);

  const canModerate = permissions.canModerateContent;
  const canManageUsers = permissions.canManageUsers;
  const canChangeRoles = permissions.canChangeRoles;
  const canViewReports = permissions.canViewReports;
  const canViewAuditLogs = permissions.canViewAuditLogs;
  const canManageSettings = permissions.canManageSettings;

  return {
    userRole,
    isStaff,
    hasRole,
    canActOnRole,
    canModerate,
    canManageUsers,
    canChangeRoles,
    canViewReports,
    canViewAuditLogs,
    canManageSettings,
  };
}
