import React from 'react';
import { Compass } from 'lucide-react';

const Loading = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
      <Compass className="h-12 w-12 text-blue-600 animate-spin" />
      <p className="mt-4 text-slate-600 font-medium">Loading...</p>
    </div>
  );
};

export default Loading;
