import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { User, Camera } from 'lucide-react'
import toast from 'react-hot-toast'

const ProfilePage = () => {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')

  const handleSave = () => {
    // 실제로는 API 호출
    toast.success('프로필이 업데이트되었습니다!')
    setIsEditing(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">프로필</h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="btn-primary"
        >
          {isEditing ? '취소' : '편집'}
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">개인 정보</h3>
          <p className="card-description">계정 정보를 관리하세요</p>
        </div>
        <div className="card-content">
          <div className="space-y-6">
            {/* 프로필 이미지 */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="h-12 w-12 text-primary-600" />
                </div>
                {isEditing && (
                  <button className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full hover:bg-primary-700">
                    <Camera className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900">프로필 사진</h4>
                <p className="text-sm text-gray-500">
                  {isEditing ? '클릭하여 이미지를 변경하세요' : 'JPG, PNG 파일만 업로드 가능합니다'}
                </p>
              </div>
            </div>

            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름
              </label>
              {isEditing ? (
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              ) : (
                <p className="text-gray-900">{user?.name}</p>
              )}
            </div>

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              {isEditing ? (
                <input
                  type="email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              ) : (
                <p className="text-gray-900">{user?.email}</p>
              )}
            </div>

            {/* 저장 버튼 */}
            {isEditing && (
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn-outline"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary"
                >
                  저장
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 계정 설정 */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">계정 설정</h3>
          <p className="card-description">보안 및 알림 설정을 관리하세요</p>
        </div>
        <div className="card-content">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">이메일 알림</h4>
                <p className="text-sm text-gray-500">중요한 업데이트에 대한 이메일을 받습니다</p>
              </div>
              <button className="bg-primary-600 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                <span className="translate-x-5 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">푸시 알림</h4>
                <p className="text-sm text-gray-500">실시간 알림을 받습니다</p>
              </div>
              <button className="bg-gray-200 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                <span className="translate-x-0 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
