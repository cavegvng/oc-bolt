import type { UserRole, RolePermissions } from '../types/moderation';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 5,
  admin: 4,
  super_moderator: 3,
  moderator: 2,
  user: 1,
};

export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role] || 0;
}

export function canActOnRole(actorRole: UserRole, targetRole: UserRole): boolean {
  const actorLevel = getRoleLevel(actorRole);
  const targetLevel = getRoleLevel(targetRole);

  return actorLevel > targetLevel;
}

export function hasMinimumRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
}

export function getRolePermissions(role: UserRole): RolePermissions {
  const level = getRoleLevel(role);

  return {
    canViewReports: level >= 2,
    canResolveReports: level >= 2,
    canModerateContent: level >= 2,
    canManageUsers: level >= 3,
    canChangeRoles: level >= 4,
    canViewAuditLogs: level >= 3,
    canManageSettings: level >= 4,
    canActOnRole: (targetRole: UserRole) => canActOnRole(role, targetRole),
  };
}

export function isStaffRole(role: UserRole): boolean {
  return ['owner', 'admin', 'super_moderator', 'moderator'].includes(role);
}

export function getAvailableRolesForPromotion(currentRole: UserRole): UserRole[] {
  const currentLevel = getRoleLevel(currentRole);

  const allRoles: UserRole[] = ['user', 'moderator', 'super_moderator', 'admin', 'owner'];

  return allRoles.filter(role => {
    const targetLevel = getRoleLevel(role);
    return targetLevel < currentLevel;
  });
}

export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    owner: 'Owner',
    admin: 'Admin',
    super_moderator: 'Super Moderator',
    moderator: 'Moderator',
    user: 'User',
  };

  return displayNames[role] || 'Unknown';
}

export function getRoleColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    owner: 'text-red-600 dark:text-red-400',
    admin: 'text-orange-600 dark:text-orange-400',
    super_moderator: 'text-blue-600 dark:text-blue-400',
    moderator: 'text-green-600 dark:text-green-400',
    user: 'text-gray-600 dark:text-gray-400',
  };

  return colors[role] || 'text-gray-600 dark:text-gray-400';
}
