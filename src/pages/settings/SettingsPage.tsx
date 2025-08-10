import { useState } from 'react'
import { Moon, Sun, Globe, Shield, Bell } from 'lucide-react'

const SettingsPage = () => {
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState('ko')
  const [notifications, setNotifications] = useState(true)

  const settings = [
    {
      title: '테마',
      description: '다크 모드 또는 라이트 모드를 선택하세요',
      icon: darkMode ? Moon : Sun,
      action: (
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="bg-primary-600 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            darkMode ? 'translate-x-5' : 'translate-x-0'
          }`}></span>
        </button>
      ),
    },
    {
      title: '언어',
      description: '애플리케이션 언어를 설정하세요',
      icon: Globe,
      action: (
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="input w-32"
        >
          <option value="ko">한국어</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
        </select>
      ),
    },
    {
      title: '알림',
      description: '알림 설정을 관리하세요',
      icon: Bell,
      action: (
        <button
          onClick={() => setNotifications(!notifications)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
            notifications ? 'bg-primary-600' : 'bg-gray-200'
          }`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            notifications ? 'translate-x-5' : 'translate-x-0'
          }`}></span>
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">설정</h1>
        <p className="text-gray-600">애플리케이션 설정을 관리하세요</p>
      </div>

      {/* 일반 설정 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">일반 설정</h3>
          <p className="card-description">기본 애플리케이션 설정</p>
        </div>
        <div className="card-content">
          <div className="space-y-6">
            {settings.map((setting) => (
              <div key={setting.title} className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <setting.icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{setting.title}</h4>
                    <p className="text-sm text-gray-500">{setting.description}</p>
                  </div>
                </div>
                {setting.action}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 보안 설정 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">보안</h3>
          <p className="card-description">계정 보안 설정</p>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-red-100 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">비밀번호 변경</h4>
                  <p className="text-sm text-gray-500">계정 보안을 위해 정기적으로 비밀번호를 변경하세요</p>
                </div>
              </div>
              <button className="btn-outline">변경</button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">2단계 인증</h4>
                  <p className="text-sm text-gray-500">추가 보안을 위해 2단계 인증을 활성화하세요</p>
                </div>
              </div>
              <button className="btn-outline">설정</button>
            </div>
          </div>
        </div>
      </div>

      {/* 데이터 관리 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">데이터 관리</h3>
          <p className="card-description">데이터 내보내기 및 삭제</p>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">데이터 내보내기</h4>
                <p className="text-sm text-gray-500">모든 데이터를 JSON 형식으로 다운로드</p>
              </div>
              <button className="btn-outline">내보내기</button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-red-900">계정 삭제</h4>
                <p className="text-sm text-gray-500">계정과 모든 데이터를 영구적으로 삭제</p>
              </div>
              <button className="btn-outline text-red-600 border-red-300 hover:bg-red-50">
                삭제
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
