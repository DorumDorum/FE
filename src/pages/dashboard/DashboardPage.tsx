import { useAuth } from '@/hooks/useAuth'
import { BarChart3, Users, Activity, TrendingUp } from 'lucide-react'

const DashboardPage = () => {
  const { user } = useAuth()

  const stats = [
    {
      name: '총 사용자',
      value: '1,234',
      icon: Users,
      change: '+12%',
      changeType: 'positive',
    },
    {
      name: '활성 사용자',
      value: '891',
      icon: Activity,
      change: '+5%',
      changeType: 'positive',
    },
    {
      name: '매출',
      value: '₩12,345,678',
      icon: TrendingUp,
      change: '+23%',
      changeType: 'positive',
    },
    {
      name: '성과 지수',
      value: '94.2%',
      icon: BarChart3,
      change: '+2.1%',
      changeType: 'positive',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600">안녕하세요, {user?.name}님!</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="bg-primary-100 p-3 rounded-lg">
                  <stat.icon className="h-6 w-6 text-primary-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-600 ml-1">지난 달 대비</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">사용자 활동</h3>
            <p className="card-description">최근 30일간의 사용자 활동 추이</p>
          </div>
          <div className="card-content">
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">차트가 여기에 표시됩니다</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">최근 활동</h3>
            <p className="card-description">시스템의 최근 활동 내역</p>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-primary-600 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      새로운 사용자가 가입했습니다
                    </p>
                    <p className="text-xs text-gray-500">2시간 전</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
