function UserTable({ users, onSelectUser, onViewTimeEntries }) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aktionen</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id} className={!user.active ? 'bg-gray-100 opacity-60' : ''}>
              <td className="px-6 py-4 whitespace-nowrap font-medium">{user.displayName}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  user.clockedIn ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {user.clockedIn ? 'Eingestempelt' : 'Ausgestempelt'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap space-x-3">
                <button
                  onClick={() => onSelectUser(user)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Details
                </button>
                <button
                  onClick={() => onViewTimeEntries(user)}
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  Zeiten
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserTable;