export const pruneDeletedRoomState = (state, deletedRoomNo) => {
  if (!deletedRoomNo) {
    return {
      recruitingRooms: state.recruitingRooms,
      appliedRooms: state.appliedRooms,
      joinedRooms: state.joinedRooms,
      expandedRoomIds: state.expandedRoomIds,
      roomRules: state.roomRules,
      roomOtherNotes: state.roomOtherNotes,
      likedRoomIds: state.likedRoomIds,
    }
  }

  const nextExpandedRoomIds = new Set(state.expandedRoomIds)
  nextExpandedRoomIds.delete(deletedRoomNo)

  const nextRoomRules = { ...state.roomRules }
  delete nextRoomRules[deletedRoomNo]

  const nextRoomOtherNotes = { ...state.roomOtherNotes }
  delete nextRoomOtherNotes[deletedRoomNo]

  const nextLikedRoomIds = new Set(state.likedRoomIds)
  nextLikedRoomIds.delete(deletedRoomNo)

  return {
    recruitingRooms: state.recruitingRooms.filter((room) => room.id !== deletedRoomNo),
    appliedRooms: state.appliedRooms.filter((room) => room.id !== deletedRoomNo),
    joinedRooms: state.joinedRooms.filter((room) => room.id !== deletedRoomNo),
    expandedRoomIds: nextExpandedRoomIds,
    roomRules: nextRoomRules,
    roomOtherNotes: nextRoomOtherNotes,
    likedRoomIds: nextLikedRoomIds,
  }
}
