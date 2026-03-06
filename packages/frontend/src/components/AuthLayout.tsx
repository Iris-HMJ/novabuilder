import { ReactNode } from 'react';
import { RobotOutlined, ThunderboltOutlined, SafetyCertificateOutlined } from '@ant-design/icons';

interface AuthLayoutProps {
  children: ReactNode;
}

const features = [
  { icon: <RobotOutlined />, title: 'AI 智能生成', desc: '自然语言描述，快速构建应用' },
  { icon: <ThunderboltOutlined />, title: '拖拽式搭建', desc: '可视化操作，无需编码' },
  { icon: <SafetyCertificateOutlined />, title: '私有化部署', desc: '数据安全，企业级保障' },
];

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="auth-layout">
      {/* 左侧品牌区 */}
      <div className="auth-brand-section">
        <div className="brand-content">
          <div className="brand-header">
            <div className="logo-wrapper">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="48" rx="12" fill="url(#logoGradient)"/>
                <path d="M14 24L20 18L26 24L32 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 30L20 24L26 30L32 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="logoGradient" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1677ff"/>
                    <stop offset="1" stopColor="#4096ff"/>
                  </linearGradient>
                </defs>
              </svg>
              <span className="logo-text">NovaBuilder</span>
            </div>
            <h1 className="brand-title">AI 原生低代码平台</h1>
            <p className="brand-subtitle">自然语言描述，快速构建企业内部工具</p>
          </div>

          <div className="feature-cards">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <div className="feature-text">
                  <div className="feature-title">{feature.title}</div>
                  <div className="feature-desc">{feature.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 背景动效 */}
        <div className="bg-animation">
          <div className="floating-circle circle-1"></div>
          <div className="floating-circle circle-2"></div>
          <div className="floating-circle circle-3"></div>
        </div>
      </div>

      {/* 右侧表单区 */}
      <div className="auth-form-section">
        {children}
      </div>

      <style>{`
        .auth-layout {
          display: flex;
          min-height: 100vh;
          min-width: 1024px;
        }

        .auth-brand-section {
          flex: 0 0 60%;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand-content {
          position: relative;
          z-index: 1;
          padding: 48px;
          width: 100%;
          max-width: 560px;
        }

        .brand-header {
          text-align: center;
          margin-bottom: 64px;
        }

        .logo-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 32px;
        }

        .logo-text {
          font-size: 32px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.5px;
        }

        .brand-title {
          font-size: 36px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 16px;
          letter-spacing: -0.5px;
        }

        .brand-subtitle {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.7);
          line-height: 1.6;
        }

        .feature-cards {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          background: rgba(255, 255, 255, 0.12);
          transform: translateY(-2px);
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #1677ff 0%, #4096ff 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: #fff;
        }

        .feature-text {
          flex: 1;
        }

        .feature-title {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 4px;
        }

        .feature-desc {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.6);
        }

        /* 背景动效 */
        .bg-animation {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .floating-circle {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(22, 119, 255, 0.3) 0%, transparent 70%);
          animation: float 8s ease-in-out infinite;
        }

        .circle-1 {
          width: 400px;
          height: 400px;
          top: -100px;
          right: -100px;
          animation-delay: 0s;
        }

        .circle-2 {
          width: 300px;
          height: 300px;
          bottom: -50px;
          left: -50px;
          animation-delay: -3s;
        }

        .circle-3 {
          width: 200px;
          height: 200px;
          top: 50%;
          left: 30%;
          animation-delay: -5s;
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.5;
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
            opacity: 0.8;
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
            opacity: 0.6;
          }
        }

        .auth-form-section {
          flex: 0 0 40%;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
        }

        @media (max-width: 1023px) {
          .auth-layout {
            min-width: unset;
          }
          .auth-brand-section {
            display: none;
          }
          .auth-form-section {
            flex: 1;
          }
        }
      `}</style>
    </div>
  );
}
