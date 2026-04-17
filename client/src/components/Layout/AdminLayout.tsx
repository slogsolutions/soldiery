import AdminSidebar from "./AdminSidebar";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-[#030712] selection:bg-green-500/30 font-sans relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-green-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      <AdminSidebar />
      <main className="flex-1 flex flex-col min-h-screen w-full relative z-10 px-8 py-6 overflow-y-auto custom-scrollbar">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;