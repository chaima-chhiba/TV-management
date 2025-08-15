import React from 'react';
import { Edit, Trash2, Monitor, MapPin, Wifi, WifiOff } from 'lucide-react';

const TVCard = ({ tv, onEdit, onDelete, isSelected, onSelect }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getLayoutText = (layout) => {
    switch (layout) {
      case 1: return 'Full Screen';
      case 2: return '2 Split';
      case 4: return '4 Split';
      default: return 'Unknown';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border-2 hover:shadow-lg transition-all ${
      isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
    }`}>
      {/* Selection Checkbox */}
      <div className="p-4 pb-2">
        <div className="flex justify-between items-start mb-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="rounded border-gray-300 mt-1"
          />
          <div className={`w-3 h-3 rounded-full ${getStatusColor(tv.status)}`}></div>
        </div>

        <div className="flex items-center space-x-3 mb-3">
          <Monitor className="text-gray-600" size={24} />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{tv.name}</h3>
            <p className="text-sm text-gray-600">{tv.department}</p>
          </div>
        </div>

        {/* Location */}
        {tv.location && (
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <MapPin size={14} className="mr-1" />
            {tv.location}
          </div>
        )}

        {/* Status with Icon */}
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Status:</span>
          <div className="flex items-center space-x-1">
            {tv.status === 'online' ? 
              <Wifi size={14} className="text-green-600" /> : 
              <WifiOff size={14} className="text-red-600" />
            }
            <span className={`font-medium capitalize ${
              tv.status === 'online' ? 'text-green-600' : 'text-red-600'
            }`}>
              {tv.status}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Layout:</span>
          <span className="font-medium text-gray-900">
            {getLayoutText(tv.layout)}
          </span>
        </div>

        {tv.ipAddress && (
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">IP Address:</span>
            <span className="font-mono text-gray-900 text-xs">
              {tv.ipAddress}
            </span>
          </div>
        )}

        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Created:</span>
          <span className="text-gray-900">
            {new Date(tv.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 rounded-b-lg">
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(tv)}
            className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <Edit size={14} />
            <span>Edit</span>
          </button>
          
          <button
            onClick={() => onDelete(tv.id)}
            className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
          
          <button
            onClick={() => window.open(`/display/${tv._id || tv.id}`, '_blank')}
            className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded text-sm font-medium transition-colors flex items-center justify-center space-x-1"
          >
            <Monitor size={14} />
            <span>View</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TVCard;