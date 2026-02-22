import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import WeeklyDashboard from './components/WeeklyDashboard';
import UserDetailsPage from './components/UserDetailsPage';
import UserTimesheetPage from './components/UserTimesheetPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<WeeklyDashboard />} />
            <Route path="/user/:id" element={<UserDetailsPage />} />
            <Route path="/user/:id/timesheet" element={<UserTimesheetPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;