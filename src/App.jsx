import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './components/Dashboard';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-4 px-6">
            <h1 className="text-2xl font-bold text-gray-900">Rasptime Admin</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto py-6 px-6">
          <Dashboard />
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;