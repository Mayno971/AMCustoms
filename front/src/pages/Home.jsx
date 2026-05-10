import React from 'react';
import ServiceCard from '../components/ServiceCard';
import useFetch from '../hooks/useFetch';

const Home = () => {
  // Utilisation du hook personnalisé pour récupérer les services depuis ton back-end
  const { data: services, loading, error } = useFetch('http://localhost:3000/api/services');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
            Nos Services
          </h1>
          <p className="mt-4 text-xl text-gray-500 dark:text-gray-400">
            Découvrez ce que nous pouvons faire pour vous.
          </p>
        </div>

        {loading && <p className="text-center text-gray-500 dark:text-gray-400">Chargement en cours...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {services && services.map((service) => (
            <ServiceCard
              key={service.id}
              title={service.title}
              description={service.description}
              image={service.image}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;