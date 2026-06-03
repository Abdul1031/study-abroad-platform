import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary">
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center text-white">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Study in Germany</h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Your AI-powered guide to studying at German universities
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/dashboard">
              <Button className="bg-accent text-primary hover:bg-yellow-500">Get Started</Button>
            </Link>
            <Button variant="outline" className="text-white border-white">
              Learn More
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          {[
            {
              title: 'Student Profiles',
              description: 'Create and manage your study profile',
            },
            {
              title: 'University Matching',
              description: 'Find universities that match your goals',
            },
            {
              title: 'Application Timeline',
              description: 'Plan your Germany application journey',
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white bg-opacity-10 backdrop-blur-lg rounded-lg p-6 text-white"
            >
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-blue-100">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
