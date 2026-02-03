export interface Room {
  id: string
  title: string
  roomType: string
  capacity: number
  currentMembers: number
  description: string
  hostName: string
  tags: string[]
  createdAt: string
  status: 'recruiting' | 'full' | 'closed'
  residencePeriod?: string // 거주기간 (예: "학기(16주)", "반기(24주)", "계절학기")
}

export interface RoomCardProps {
  room: Room
  onChatRequest: (roomId: string) => void
  onApply: (roomId: string) => void
}

export interface RoomSearchProps {
  onSearch: (query: string) => void
  placeholder?: string
}
