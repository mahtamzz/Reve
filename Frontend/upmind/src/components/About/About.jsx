export default function About() {
    return (
      <div className="min-h-screen bg-loginbg font-serif text-brand-text flex flex-col items-center">
  
        <header className="w-full max-w-6xl flex justify-between items-center px-10 pt-10 text-white">
          <div className="text-3xl tracking-widest text-creamtext">REVE</div>
        </header>
  
        <div className="mt-16 bg-creamtext text-brand-text rounded-xl px-8 sm:px-12 py-12 w-full max-w-3xl shadow">
          <h1 className="text-3xl text-chocolate text-center mb-6">About Us</h1>
  
          <p className="text-chocolate/80 text-lg leading-relaxed">
            REVE is a modern platform designed to bring students and learners together.
            Our goal is to help people study smarter, connect with peers, and stay motivated.
            With tools for collaboration, scheduling, and group sessions, REVE makes learning
            more accessible and enjoyable.
          </p>
  
          <p className="text-chocolate/80 text-lg leading-relaxed mt-4">
            We believe in productivity, simplicity, and community.  
            Whether you're studying for exams or learning something new,  
            REVE is here to help you grow.
          </p>
        </div>
  
      </div>
    );
  }
  