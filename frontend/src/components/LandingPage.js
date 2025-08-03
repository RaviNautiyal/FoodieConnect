import React, { useState, useEffect } from 'react';

const features = [
  {
    title: 'Advanced Security',
    description: 'Multi-layer security with encrypted payments and secure user authentication.',
    metric: 'SSL Secured'
  },
  {
    title: 'Smart Delivery',
    description: 'AI-optimized routing system ensures your food arrives hot and fresh.',
    metric: '18min Avg'
  },
  {
    title: 'Modern Platform',
    description: 'Built with latest technologies for seamless user experience across all devices.',
    metric: 'Cross-Platform'
  },
  {
    title: 'Quality Assurance',
    description: 'Rigorous restaurant partner verification and real-time order monitoring.',
    metric: 'Quality First'
  },
];

const stats = [
  { value: '18min', label: 'Avg Delivery Time' },
  { value: '24/7', label: 'Customer Support' },
  { value: '25+', label: 'Food Categories' },
  { value: '5km', label: 'Delivery Radius' }
];

const LandingPage = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0e1a',
      fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: '#ffffff',
      overflow: 'hidden',
    }}>
      
      {/* Navigation handled by the global Navigation component */}

      {/* Grid Background */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(100, 255, 218, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(100, 255, 218, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        opacity: 0.4,
      }} />

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 60px',
        background: `
          radial-gradient(circle at 20% 80%, rgba(100, 255, 218, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(100, 255, 218, 0.05) 0%, transparent 50%)
        `,
      }}>
        <div style={{
          maxWidth: '1200px',
          textAlign: 'center',
          transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
          opacity: isLoaded ? 1 : 0,
          transition: 'all 1s ease-out',
        }}>

          {/* Main Headline */}
          <h1 style={{
            fontSize: 'clamp(48px, 6vw, 72px)',
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: '24px',
            letterSpacing: '-2px',
            background: 'linear-gradient(135deg, #ffffff 0%, #8892b0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Enterprise Food Delivery
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #64ffda 0%, #4db8ff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Infrastructure
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: '20px',
            lineHeight: 1.6,
            color: '#8892b0',
            maxWidth: '640px',
            margin: '0 auto 48px',
            fontWeight: 400,
          }}>
            Next-generation food delivery platform built with cutting-edge technology. 
            Experience seamless ordering, real-time tracking, and lightning-fast delivery.
          </p>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '80px',
          }}>
            <button 
              onClick={() => window.location.href = '/register'}
              style={{
                padding: '16px 32px',
                background: 'linear-gradient(135deg, #64ffda 0%, #4db8ff 100%)',
                border: 'none',
                borderRadius: '6px',
                color: '#0a0e1a',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 20px rgba(100, 255, 218, 0.3)',
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 30px rgba(100, 255, 218, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 20px rgba(100, 255, 218, 0.3)';
              }}>
              Join Waitlist
            </button>
            <button 
              onClick={() => window.location.href = '/login'}
              style={{
                padding: '16px 32px',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}>
              Login
            </button>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '40px',
            maxWidth: '800px',
            margin: '0 auto',
          }}>
            {stats.map((stat, idx) => (
              <div key={idx} style={{
                textAlign: 'center',
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
              }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: 700,
                  color: '#64ffda',
                  marginBottom: '8px',
                  letterSpacing: '-1px',
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#8892b0',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Elements */}
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '300px',
          height: '200px',
          background: 'linear-gradient(135deg, rgba(100, 255, 218, 0.1) 0%, transparent 100%)',
          borderRadius: '20px',
          filter: 'blur(40px)',
          animation: 'floatSlow 6s ease-in-out infinite',
        }} />
        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '10%',
          width: '200px',
          height: '300px',
          background: 'linear-gradient(135deg, rgba(77, 184, 255, 0.1) 0%, transparent 100%)',
          borderRadius: '20px',
          filter: 'blur(40px)',
          animation: 'floatSlow 8s ease-in-out infinite reverse',
        }} />
      </section>

      {/* Features Section */}
      <section style={{
        padding: '120px 60px',
        position: 'relative',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '80px',
          }}>
            <h2 style={{
              fontSize: '40px',
              fontWeight: 700,
              marginBottom: '20px',
              color: '#ffffff',
              letterSpacing: '-1px',
            }}>
              Why Choose FoodieConnect
            </h2>
            <p style={{
              fontSize: '18px',
              color: '#8892b0',
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}>
              Built with cutting-edge technology and designed for the modern user. 
              Experience the future of food delivery with our innovative platform.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
          }}>
            {features.map((feature, idx) => (
              <div key={idx} style={{
                padding: '40px 32px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(100, 255, 218, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '20px',
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#ffffff',
                    margin: 0,
                  }}>
                    {feature.title}
                  </h3>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#64ffda',
                    background: 'rgba(100, 255, 218, 0.1)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                  }}>
                    {feature.metric}
                  </span>
                </div>
                <p style={{
                  color: '#8892b0',
                  lineHeight: 1.6,
                  margin: 0,
                  fontSize: '16px',
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
      `}</style>

      {/* Footer */}
<footer style={{
  padding: '60px 40px',
  background: 'rgba(255, 255, 255, 0.02)',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  backdropFilter: 'blur(10px)',
  color: '#8892b0',
  fontSize: '14px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px'
}}>
  <div style={{
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    fontWeight: 500,
  }}>
    <a href="/privacy" style={{ color: '#8892b0', textDecoration: 'none' }}>Privacy Policy</a>
    <a href="/terms" style={{ color: '#8892b0', textDecoration: 'none' }}>Terms of Service</a>
    <a href="/contact" style={{ color: '#8892b0', textDecoration: 'none' }}>Contact</a>
    <a href="/faq" style={{ color: '#8892b0', textDecoration: 'none' }}>FAQ</a>
  </div>
  
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <span>© {new Date().getFullYear()} FoodieConnect</span>
    <span style={{ color: '#64ffda' }}>•</span>
    <span>Made with ❤️ for hungry coders</span>
  </div>

  <div style={{ fontSize: '12px', opacity: 0.6 }}>
    Built with React & ❤️ by the FoodieConnect Dev Team
  </div>
</footer>

    </div>
    
  );
};

export default LandingPage;