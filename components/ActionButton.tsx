
import React from 'react';

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

const ActionButton: React.FC<ActionButtonProps> = ({ label, onClick, icon }) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-x-3 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 rounded-lg px-5 py-3.5 transition-all duration-200 ease-in-out transform active:scale-95"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

export default ActionButton;
