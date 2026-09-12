import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Button from '../components/Button';
import { Search, Map, MapPin, Cloud, Hotel, Bus } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-4">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-600 text-sm">{description}</p>
  </div>
);

const Home = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <div className="relative bg-blue-600 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-700 to-blue-500 opacity-90"></div>
          {/* Subtle background pattern or image could go here */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 flex flex-col items-center text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6">
              Plan Your Next Adventure
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mb-10">
              Voyago makes travel planning effortless. Discover amazing places, check weather, book hotels, and map your journey all in one place.
            </p>
            
            {/* Search Bar */}
            <div className="w-full max-w-3xl bg-white p-2 rounded-full shadow-lg flex items-center">
              <div className="flex-grow px-4 flex items-center">
                <Search className="h-5 w-5 text-slate-400 mr-3" />
                <input 
                  type="text" 
                  placeholder="Where do you want to go?" 
                  className="w-full py-3 bg-transparent border-none focus:outline-none text-slate-900 placeholder-slate-400"
                />
              </div>
              <Button className="rounded-full px-8 py-3 shrink-0">Search</Button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything You Need</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              From inspiration to itinerary, Voyago provides all the tools necessary to make your trip unforgettable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={MapPin} 
              title="Discover Places" 
              description="Find hidden gems and popular attractions tailored to your interests."
            />
            <FeatureCard 
              icon={Cloud} 
              title="Live Weather" 
              description="Check real-time weather forecasts so you're always prepared."
            />
            <FeatureCard 
              icon={Hotel} 
              title="Book Hotels" 
              description="Find the perfect accommodation at the best price."
            />
            <FeatureCard 
              icon={Bus} 
              title="Transit Options" 
              description="Explore bus and train routes to get around easily."
            />
            <FeatureCard 
              icon={Map} 
              title="Trip Planner" 
              description="Organize your itinerary day-by-day in an interactive map."
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
