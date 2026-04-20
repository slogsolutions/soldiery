import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  centerToContent?: boolean;
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const Modal = ({ title, onClose, children, size = "md", centerToContent = true }: ModalProps) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className={`fixed inset-0 z-[40] flex items-center justify-center p-4 md:p-6 ${centerToContent ? 'md:pl-72' : ''}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: "fadeIn 0.2s ease-out" }}
      />
      
      {/* Modal Panel */}
      <div
        ref={panelRef}
        className={`relative bg-gray-900/95 border border-gray-700/60 rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.6),0_0_30px_rgba(34,197,94,0.05)] w-full ${sizeClasses[size]} mx-auto overflow-hidden backdrop-blur-xl`}
        style={{ animation: "modalSlideIn 0.25s ease-out" }}
      >
        
        {/* Ambient Glow Effects */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-green-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/5 rounded-full blur-[60px] pointer-events-none" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between p-5 border-b border-gray-800/60 bg-gray-900/60">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
            <h2 className="text-lg font-bold text-white tracking-wide">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white hover:bg-gray-800 p-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-500/30 group"
          >
            <X size={18} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>
        
        {/* Body */}
        <div className="relative p-5 max-h-[85vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>

      {/* Inline keyframe styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Modal;