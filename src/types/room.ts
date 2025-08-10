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
