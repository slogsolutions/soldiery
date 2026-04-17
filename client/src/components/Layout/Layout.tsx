import Sidebar from "./Sidebar";
import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-green-500/30 selection:text-green-200">
      
      {/* Dynamic Grid Background for 'Command Center' feel */}
      <div className="fixed inset-0 pointer-events-none z-0 mix-blend-overlay opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
      </div>

      {/* Glow Effects */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-green-900/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none z-0"></div>

      {/* Sidebar — fixed left */}
      <div className="fixed top-0 left-0 h-full z-20">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="ml-0 md:ml-72 flex-1 w-full relative z-10 pb-12 transition-all duration-300">
        {/* Sleek top ambient header that blends */}
        <div className="h-16 border-b border-gray-900/50 bg-gray-950/50 backdrop-blur-md sticky top-0 z-20 flex items-center px-8 shadow-sm">
           <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-gray-500">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              SECURE CONNECTION
           </div>
        </div>
        
        <div className="px-4 sm:px-8 pt-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
          {children}
        </div>
      </main>

    </div>
  );
};

export default Layout;