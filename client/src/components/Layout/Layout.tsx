import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* sidebar — fixed left */}
      <Sidebar />

      {/* main content — offset by sidebar width */}
      <main className="ml-64 flex-1 p-6 overflow-auto min-h-screen">
        {children}
      </main>

    </div>
  );
};

export default Layout;