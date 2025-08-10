import { Link } from 'react-router-dom'
import { ArrowRight, Smartphone, Zap, Shield } from 'lucide-react'

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-xl font-bold text-primary-600">DorumDorum</div>
            <div className="flex space-x-4">
              <Link
                to="/login"
                className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                로그인
              </Link>
              <Link
                to="/register"
                className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
              >
                회원가입
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 히어로 섹션 */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            현대적인
            <span className="text-primary-600"> PWA</span>
            <br />
            웹 애플리케이션
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            React와 TypeScript로 구축된 Progressive Web App으로 
            네이티브 앱과 같은 경험을 제공합니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-700 transition-colors"
            >
              시작하기
              <ArrowRight className="inline ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/login"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-50 transition-colors"
            >
              로그인
            </Link>
          </div>
        </div>

        {/* 기능 섹션 */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Smartphone className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">모바일 최적화</h3>
            <p className="text-gray-600">
              모든 디바이스에서 완벽하게 작동하는 반응형 디자인
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">빠른 성능</h3>
            <p className="text-gray-600">
              Vite와 최신 기술로 구축된 빠르고 효율적인 애플리케이션
            </p>
          </div>
          <div className="text-center">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">안전한 인증</h3>
            <p className="text-gray-600">
              보안이 강화된 사용자 인증 및 권한 관리 시스템
            </p>
          </div>
        </div>

        {/* CTA 섹션 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-gray-600 mb-6">
            무료로 가입하고 모든 기능을 체험해보세요.
          </p>
          <Link
            to="/register"
            className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-700 transition-colors inline-flex items-center"
          >
            무료로 시작하기
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </main>
    </div>
  )
}

export default HomePage
