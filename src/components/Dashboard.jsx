import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import UserTable from './UserTable';
import UserDetailsModal from './UserDetailsModal';
import TimeEntriesModal from './TimeEntriesModal';

function Dashboard() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [timeEntriesUser, setTimeEntriesUser] = useState(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users', includeInactive],
    queryFn: () => api.getUsers(includeInactive),
  });

  if (isLoading) return <div className="text-center py-8">Laden...</div>;
  if (error) return <div className="text-center py-8 text-red-600">Fehler: {error.message}</div>;

  const handleViewTimeEntries = (user) => {
    setSelectedUser(null);
    setTimeEntriesUser(user);
  };

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Benutzer</h2>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-gray-600">Inaktive anzeigen</span>
        </label>
      </div>

      <UserTable 
        users={users} 
        onSelectUser={setSelectedUser} 
        onViewTimeEntries={setTimeEntriesUser} 
      />
      {selectedUser && (
        <UserDetailsModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)}
          onViewTimeEntries={handleViewTimeEntries}
        />
      )}

      {timeEntriesUser && (
        <TimeEntriesModal 
          user={timeEntriesUser} 
          onClose={() => setTimeEntriesUser(null)} 
        />
      )}
    </div>
  );
}

export default Dashboard;