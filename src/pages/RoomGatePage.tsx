import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiUrl } from '../utils/api'

const RoomGatePage = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const checkRoomExist = async () => {
      try {
        const token = localStorage.getItem('accessToken')
        if (!token) {
          navigate('/login', { replace: true })
          return
        }

        const res = await fetch(getApiUrl('/api/rooms/me/exists'), {
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.status === 401) {
          navigate('/login', { replace: true })
          return
        }

        const contentType = res.headers.get('content-type') ?? ''
        const rawBody = await res.text()
        if (!res.ok) {
          console.error('[rooms] check exists failed', {
            status: res.status,
            contentType,
            body: rawBody,
          })
          navigate('/rooms/search', { replace: true })
          return
        }

        let data: any
        try {
          data = rawBody ? JSON.parse(rawBody) : null
        } catch (e) {
          console.error('[rooms] check exists parse error', { contentType, rawBody }, e)
          throw new Error('서버 응답(JSON)을 파싱하지 못했습니다.')
        }

        // CheckMyRoomController response body 그대로 로그
        console.log('[CheckMyRoom] raw response body:', data)

        // ResponseEntity 형식: 직접 접근
        const payload = data
        if (payload?.isExist) {
          const roomNo = payload?.roomNo
          navigate('/rooms/me', { replace: true, state: { roomNo } })
          return
        }
        navigate('/rooms/search', { replace: true })
      } catch (err) {
        console.error('[rooms] check exists error', err)
        navigate('/rooms/search', { replace: true })
      }
    }

    checkRoomExist()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="h-screen bg-white flex items-center justify-center text-sm text-gray-500">
      불러오는 중...
    </div>
  )
}

export default RoomGatePage
