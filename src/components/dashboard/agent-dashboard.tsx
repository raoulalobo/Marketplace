// Dashboard pour les agents immobiliers - VERSION OPTIMISEE
'use client';

import { AgentDashboard as OptimizedAgentDashboard } from './agent-dashboard-optimized';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AgentDashboardProps {
  user: User;
}

// Wrapper vers la version optimisée pour maintenir la compatibilité
export function AgentDashboard({ user }: AgentDashboardProps) {
  return (
    <OptimizedAgentDashboard user={user} />
  );
}