import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import '../styles/landing.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const handleAppLaunch = (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="social-landing">
      {/* TopNavBar */}
      <header className="navbar">
        <div className="nav-container">
          <a className="brand" href="#" onClick={(e) => e.preventDefault()}>Latent</a>
          
          <nav className="nav-links">
            <a href="#" onClick={handleAppLaunch}>Features</a>
            <a href="#" onClick={handleAppLaunch}>Community</a>
            <a href="#" onClick={handleAppLaunch}>Mess</a>
            <a href="#" onClick={handleAppLaunch}>Campus Map</a>
          </nav>
          
          <button className="btn-pill btn-primary nav-cta" onClick={handleAppLaunch}>
            {isAuthenticated ? 'Open Dashboard' : 'Access App'}
          </button>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-text">
              <div className="hero-badge glass-panel">
                <span className="material-symbols-outlined">school</span>
                Welcome to the future of campus
              </div>
              
              <h1 className="hero-title">
                Your Campus Life, <br/>
                <span className="text-gradient">in your pocket</span>
              </h1>
              
              <p className="hero-subtitle">
                Join thousands of students on Latent to track your mess, navigate campus, and find your community in one tap.
              </p>
              
              <div className="hero-actions">
                <button className="btn-pill btn-gradient" onClick={handleAppLaunch}>
                  {isAuthenticated ? 'Enter Dashboard' : 'Join the App'}
                </button>
                <a className="btn-pill btn-outline" href="#features">
                  Watch Demo
                </a>
              </div>
            </div>
            
            <div className="hero-visuals">
              <div className="main-image-container soft-shadow">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCC4CWUjYQ8ZRkPpIGzpt6zGzQU2_TIguNFEVgPUNpfJDsImK1ZpulT5wuGAY_7hIOnCYuQua8pEBB_USoqbI2VsWB-EPC2tZBOLU7I2kHHyUvCMUTIhQatrmqz-EBFu5Ge5_if0iXFiEW523FuIKKtiVzwSg3A1WfLPM--pq4r8wGJC5psxVFca0UYAp6rvF0cwRInNIs5ai8nMxCpFcf5BPmf1w5sv7sjyC-m-I_b1u3KiFgf6twZTH6t8j0KwVRHi8GADEw_7FI" 
                  alt="Students smiling" 
                />
              </div>
              
              <div className="floating-badge badge-top glass-panel floating-element">
                <div className="badge-icon bg-pink">
                  <span className="material-symbols-outlined">groups</span>
                </div>
                <div className="badge-text">
                  <p className="title">50+ Active Clubs</p>
                  <p className="subtitle">Join the community</p>
                </div>
              </div>
              
              <div className="floating-badge badge-bottom soft-shadow floating-element-delayed">
                <div className="badge-icon-large">
                  <span className="material-symbols-outlined text-primary">qr_code_2</span>
                </div>
                <p className="title">Mess Pass Ready</p>
              </div>
              
              <div className="floating-icon floating-element">
                <span className="material-symbols-outlined">location_on</span>
              </div>
            </div>
          </div>
          
          {/* Abstract Background Shapes */}
          <div className="bg-shape shape-top"></div>
          <div className="bg-shape shape-bottom"></div>
        </section>

        {/* Statistics Banner */}
        <section className="stats-banner">
          <div className="stats-container">
            <div className="stat-item">
              <p className="stat-number">5000+</p>
              <p className="stat-label">Active Students</p>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <p className="stat-number">50+</p>
              <p className="stat-label">Student Clubs</p>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <p className="stat-number">15+</p>
              <p className="stat-label">Food Spots</p>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="features-section">
          <div className="section-header">
            <h2>Our Popular Features</h2>
            <p>Everything you need to navigate campus life, seamlessly integrated into one beautiful experience.</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card card-blue" onClick={handleAppLaunch}>
              <div className="feature-icon icon-blue">
                <span className="material-symbols-outlined">map</span>
              </div>
              <h3>Interactive Map</h3>
              <p>Never get lost again. Find classrooms, libraries, and the quickest routes across campus with our real-time interactive mapping system.</p>
            </div>
            
            <div className="feature-card card-green" onClick={handleAppLaunch}>
              <div className="feature-icon icon-green">
                <span className="material-symbols-outlined">local_activity</span>
              </div>
              <h3>Digital Mess Pass</h3>
              <p>Ditch the physical cards. Access the dining halls with a quick scan, check daily menus, and track your meal plan balance effortlessly.</p>
            </div>
            
            <div className="feature-card card-pink" onClick={handleAppLaunch}>
              <div className="feature-icon icon-pink">
                <span className="material-symbols-outlined">dynamic_feed</span>
              </div>
              <h3>Campus Feed</h3>
              <p>Stay in the loop. A curated stream of events, announcements, and club activities happening around you right now.</p>
            </div>
            
            <div className="feature-card card-yellow" onClick={handleAppLaunch}>
              <div className="feature-icon icon-yellow">
                <span className="material-symbols-outlined">group</span>
              </div>
              <h3>Study Groups</h3>
              <p>Connect with classmates instantly. Create or join study groups based on your courses and find the perfect spot to collaborate.</p>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="community" className="testimonials-section">
          <div className="section-header">
            <h2>What students are saying</h2>
            <p>Don't just take our word for it. Hear from the community.</p>
          </div>
          
          <div className="testimonials-container">
            <div className="testimonial-card rotate-left">
              <span className="material-symbols-outlined quote-mark text-primary">format_quote</span>
              <p className="review-text">"Latent completely changed how I navigate campus. I actually know what's for dinner before walking all the way to the mess hall now!"</p>
              <div className="user-info">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXr_f7tvU56uxT-xeGf3-bWMvyu68445AggzcOP3kyvYC8OaYkzoYrvso6U3HQMlAXIHDDvTRd3XEL1s5n2onVd7F08W5GDiX2QK0xqNv0yn8xU5XKT_Io-FjlHQ-VR719zAzsLCqvPb1t8taTi7k39X7iqsMuBHxsbCeh9BqYLjjtl847dcnUoH_4r8L_3px80d80LXqJoCryt0iaK3yDf5ZhQIxjTfmRmCCHg_-_dk9hvNZz8wJR5k2NexxysuDhmJuNk6o562g" alt="Sarah J." />
                <div>
                  <p className="name">Sarah J.</p>
                  <p className="major">Computer Science, '25</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card rotate-right">
              <span className="material-symbols-outlined quote-mark text-pink">format_quote</span>
              <p className="review-text">"Finding study groups used to be a hassle. The community feature makes it so easy to connect with people in my classes."</p>
              <div className="user-info">
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCF45aOJZKCJrd9t1kaZv37LbTu9o48j-2qDXpoSYS7oqOa3exoXqQvcK_xEzGcrSvMhKDURbpbGFf_-6t_yKTy9wUPFUiQnGR9UobV9v_AHk2wYEqtVDdwLB10z7JlJWZRCCQD2Z4Mua7LjwTev-Dyo1lUtC4oTkOTjzxCP5y8egpwTrtJJmUvjeR6864m_03p5xewhN_b-ctT43_DMeCCPEVfiIt03uzKbYf7jfomYPBiLoF7JTzwHos3vyejgEH1Fer550H3yr8" alt="Alex M." />
                <div>
                  <p className="name">Alex M.</p>
                  <p className="major">Business, '24</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="fade-bottom"></div>
        </section>
      </main>

      <footer className="social-footer">
        <div className="footer-container">
          <div className="footer-brand">Latent</div>
          <div className="footer-copyright">© {new Date().getFullYear()} Latent. Empowering campus life.</div>
          <nav className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Help Center</a>
            <a href="#">Contact Us</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
