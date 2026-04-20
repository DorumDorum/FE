import type { Room } from '@/types/room'

type RoomSearchDeleteState = {
  recruitingRooms: Room[]
  appliedRooms: Room[]
  joinedRooms: Room[]
  expandedRoomIds: Set<string>
  roomRules: Record<string, any>
  roomOtherNotes: Record<string, string>
  likedRoomIds: Set<string>
}

export function pruneDeletedRoomState(
  state: RoomSearchDeleteState,
  deletedRoomNo: string | null
): RoomSearchDeleteState
