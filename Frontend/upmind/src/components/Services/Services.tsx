import React from "react";

const Services: React.FC = () => {
  return (
    <div className="min-h-screen bg-loginbg font-serif text-brand-text flex flex-col items-center">

      <header className="w-full max-w-6xl flex justify-between items-center px-10 pt-10 text-white">
        <div className="text-3xl tracking-widest text-creamtext">REVE</div>
      </header>

      <div className="mt-16 bg-creamtext text-brand-text rounded-xl px-8 sm:px-12 py-12 w-full max-w-3xl shadow">
        <h1 className="text-3xl text-chocolate text-center mb-8">Our Services</h1>

        <ul className="space-y-6">
          <li className="bg-white rounded-lg shadow px-6 py-5 border border-chocolate/20">
            <h2 className="text-xl text-chocolate font-semibold">Study Sessions</h2>
            <p className="text-chocolate/70 mt-1">
              Create or join study groups and stay productive together.
            </p>
          </li>

          <li className="bg-white rounded-lg shadow px-6 py-5 border border-chocolate/20">
            <h2 className="text-xl text-chocolate font-semibold">Task Tracking</h2>
            <p className="text-chocolate/70 mt-1">
              Track your goals, progress, and daily study habits.
            </p>
          </li>

          <li className="bg-white rounded-lg shadow px-6 py-5 border border-chocolate/20">
            <h2 className="text-xl text-chocolate font-semibold">Group Management</h2>
            <p className="text-chocolate/70 mt-1">
              Organize groups, chat, and coordinate study schedules.
            </p>
          </li>
        </ul>
      </div>

    </div>
  );
};

export default Services;
