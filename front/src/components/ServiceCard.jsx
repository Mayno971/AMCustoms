import React from 'react';

const ServiceCard = ({ title, description, icon, image }) => {
  return (
    <article className="max-w-sm rounded-xl overflow-hidden shadow-lg bg-white dark:bg-gray-800 hover:shadow-2xl transition-shadow duration-300 border border-gray-100 dark:border-gray-700">
      {image && (
        <img className="w-full h-48 object-cover" src={image} alt={title} />
      )}
      <div className="px-6 py-4">
        <div className="flex items-center mb-2">
          {icon && <span className="text-2xl mr-3" aria-hidden="true">{icon}</span>}
          <h3 className="font-bold text-xl text-gray-900 dark:text-white">{title}</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-base">
          {description}
        </p>
      </div>
      <div className="px-6 pt-4 pb-6">
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
          Learn More
        </button>
      </div>
    </article>
  );
};

export default ServiceCard;
