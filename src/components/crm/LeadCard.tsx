import React from 'react';
import { MessageCircle, Video, User, Camera, MessageSquare, Globe } from 'lucide-react';
import { Source, Unit } from '@/types/crm';

interface LeadCardProps {
  customerName: string;
  origin: Source;
  businessUnit: Unit;
  onClick?: () => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ customerName, origin, businessUnit, onClick }) => {
  // Source Badge Styles
  const sourceStyles = {
    WhatsApp: 'bg-green-500/10 text-green-500 border-green-500/20',
    Web: 'bg-tech-blue/10 text-tech-blue border-blue-500/20',
    IG: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
    Messenger: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  };

  // Unit Badge Styles
  const unitStyles = {
    TravelCab: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    Experiencias: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Rewards: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  };

  // Dynamic Icon for Origin
  const getSourceIcon = (source: Source) => {
    switch (source) {
      case 'WhatsApp':
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'IG':
        return <Camera className="h-4 w-4 text-pink-500" />;
      case 'Messenger':
        return <MessageSquare className="h-4 w-4 text-indigo-500" />;
      case 'Web':
        return <Globe className="h-4 w-4 text-tech-blue" />;
      default:
        return <MessageCircle className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <div 
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <User className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-tech-blue">{customerName}</h4>
            <div className="mt-1 flex gap-2">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${sourceStyles[origin]}`}>
                <span className="mr-1">{getSourceIcon(origin)}</span>
                {origin}
              </span>
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${unitStyles[businessUnit]}`}>
                {businessUnit}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="flex items-center justify-center space-x-2 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200 hover:text-tech-blue transition-colors">
          <MessageCircle className="h-4 w-4" />
          <span>Ver Chat</span>
        </button>
        <button className="flex items-center justify-center space-x-2 rounded-md bg-tech-blue/10 px-3 py-1.5 text-sm font-medium text-tech-blue hover:bg-tech-blue/20 transition-colors">
          <Video className="h-4 w-4" />
          <span>Unirse a Meet</span>
        </button>
      </div>
    </div>
  );
};

