import { Plus, MessageSquare, X } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onSuggestionClick: (suggestion: string) => void;
  suggestions: string[];
}

export const Sidebar = ({ isOpen, onClose, onNewChat, onSuggestionClick, suggestions }: SidebarProps) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar container */}
      <div 
        className={`fixed md:relative top-0 left-0 h-full w-72 max-w-[86vw] md:w-64 md:max-w-none bg-[#0a0a0c] border-r border-white/5 z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-4 flex items-center justify-between md:justify-end">
          <h2 className="text-xl font-bold tracking-tight text-white md:hidden">Menu</h2>
          <button onClick={onClose} className="p-2 md:hidden text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 pb-4">
          <button 
            onClick={onNewChat}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1e1e24] hover:bg-[#2a2a32] border border-white/5 text-white transition-colors"
          >
            <Plus className="w-5 h-5 text-primary" />
            <span className="font-medium">New chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-2">Suggestions</h3>
          <div className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  onSuggestionClick(suggestion);
                  onClose();
                }}
                className="w-full flex items-start gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg text-left transition-colors"
              >
                <MessageSquare className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" />
                <span className="line-clamp-2">{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
