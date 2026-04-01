import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "../components/ui/button";
import { 
  Cube, 
  ShieldCheck, 
  ChartLineUp, 
  Lightning,
  ArrowRight,
  GitBranch
} from "@phosphor-icons/react";

const Landing = () => {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: <ShieldCheck size={32} weight="duotone" />,
      title: "Secure Entropy",
      description: "Multi-source entropy mixing using camera noise, network jitter, and system pools"
    },
    {
      icon: <ChartLineUp size={32} weight="duotone" />,
      title: "Fairness Analytics",
      description: "Real-time decentralization scoring and validator distribution analysis"
    },
    {
      icon: <Lightning size={32} weight="duotone" />,
      title: "Fast Selection",
      description: "SHA-256 hashed entropy for cryptographically secure validator selection"
    },
    {
      icon: <GitBranch size={32} weight="duotone" />,
      title: "Multi-Session",
      description: "Independent validator pools and history for concurrent simulations"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#00F0FF] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden">
      {/* Background grid effect */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 240, 255, 0.5) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(0, 240, 255, 0.5) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />
      
      {/* Gradient orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-[#00F0FF] rounded-full blur-[150px] opacity-10" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-[#00FF41] rounded-full blur-[150px] opacity-10" />

      {/* Header */}
      <header className="relative z-10 border-b border-[#1E2028] bg-[#050505]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Cube size={32} weight="duotone" className="text-[#00F0FF]" />
              <span className="font-heading text-xl font-semibold tracking-tight text-white">
                EntropyX
              </span>
            </div>
            <Button
              onClick={() => navigate('/dashboard')}
              data-testid="header-launch-btn"
              className="bg-[#00F0FF] text-black font-semibold px-6 hover:bg-[#00F0FF]/80 transition-colors rounded-none"
            >
              Launch App
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A0B10] border border-[#1E2028] mb-8">
              <span className="w-2 h-2 bg-[#00FF41] rounded-full animate-pulse" />
              <span className="font-mono text-xs text-[#A1A1AA] uppercase tracking-widest">
                Blockchain Security Infrastructure
              </span>
            </div>

            {/* Title */}
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tighter text-white mb-6">
              Entropy-Powered
              <br />
              <span className="text-[#00F0FF] glow-text-cyan">Validator Selection</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-[#A1A1AA] max-w-2xl mx-auto mb-12 leading-relaxed">
              Cryptographically secure validator selection using real-world entropy sources. 
              Prove fairness and decentralization through persistent analytics.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => navigate('/dashboard')}
                data-testid="hero-get-started-btn"
                className="bg-[#00F0FF] text-black font-semibold px-8 py-6 text-lg hover:bg-[#00F0FF]/80 transition-colors rounded-none flex items-center gap-2"
              >
                Launch Dashboard <ArrowRight size={20} />
              </Button>
              <Button
                onClick={login}
                data-testid="hero-signin-btn"
                variant="outline"
                className="bg-transparent border border-[#1E2028] text-white px-8 py-6 text-lg hover:bg-[#1A1C23] transition-colors rounded-none"
              >
                Sign In with Google
              </Button>
            </div>
          </div>
        </section>

        {/* Live Entropy Preview */}
        <section className="py-16 border-t border-[#1E2028]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-[#0A0B10] border border-[#1E2028] p-6 lg:p-8">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm uppercase tracking-[0.2em] font-semibold text-[#00F0FF]">
                  Live Entropy Stream
                </h4>
                <span className="badge-success font-mono text-xs px-2 py-1">ACTIVE</span>
              </div>
              <div className="font-mono text-sm text-[#52525B] overflow-hidden h-24">
                <div className="animate-hash-stream">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div key={i} className="py-1 hover:text-[#00F0FF] transition-colors">
                      {`0x${Array.from({ length: 64 }).map(() => 
                        '0123456789abcdef'[Math.floor(Math.random() * 16)]
                      ).join('')}`}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 border-t border-[#1E2028]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-heading text-2xl md:text-3xl font-semibold tracking-tight text-white mb-4">
                Enterprise-Grade Security
              </h2>
              <p className="text-[#A1A1AA] max-w-xl mx-auto">
                Built for blockchain infrastructure requiring verifiable randomness and fairness guarantees.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="bg-[#0A0B10] border border-[#1E2028] p-6 card-hover"
                  data-testid={`feature-card-${idx}`}
                >
                  <div className="text-[#00F0FF] mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-[#A1A1AA]">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-24 border-t border-[#1E2028]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="font-mono text-4xl lg:text-5xl text-[#00F0FF] mb-2">5</div>
                <div className="text-xs uppercase tracking-widest text-[#A1A1AA]">Entropy Sources</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-4xl lg:text-5xl text-[#00FF41] mb-2">256</div>
                <div className="text-xs uppercase tracking-widest text-[#A1A1AA]">Bit Security</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-4xl lg:text-5xl text-white mb-2">1000+</div>
                <div className="text-xs uppercase tracking-widest text-[#A1A1AA]">Rounds Simulated</div>
              </div>
              <div className="text-center">
                <div className="font-mono text-4xl lg:text-5xl text-[#00F0FF] mb-2">99.9%</div>
                <div className="text-xs uppercase tracking-widest text-[#A1A1AA]">Fairness Score</div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#1E2028] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Cube size={24} weight="duotone" className="text-[#00F0FF]" />
              <span className="font-heading text-sm text-[#A1A1AA]">EntropyX</span>
            </div>
            <p className="text-xs text-[#52525B]">
              Blockchain Validator Fairness & Entropy Analytics Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
