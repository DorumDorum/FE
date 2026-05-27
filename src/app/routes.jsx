import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PhoneFrameLayout } from './layouts/PhoneFrame.jsx';

import { SplashScreen, LoginScreen, SignUpScreen, FindPasswordScreen, TermsDetailScreen } from '../features/onboarding';
import { HomeScreen } from '../features/home';
import { FindRoomScreen, RoomDetailScreen, MyRoomScreen, RecommendedRoomsScreen } from '../features/rooms';
import { ChatListScreen, ChatDetailScreen } from '../features/chat';
import { MyPageScreen, ProfileEditScreen, MyApplicationsScreen, BookmarksScreen } from '../features/profile';
import {
  ChecklistEditScreen, CreateRoomScreen, CreateRoomStep3Screen,
  ApplicantDetailScreen, NoticeListScreen, NoticeDetailScreen, NotificationsScreen,
  NotificationSettingsScreen, AccountSettingsScreen, DeleteAccountScreen, SupportScreen, ChatDMScreen, ApplyMessageScreen, ApplySuccessScreen,
  CreateRoomSuccessScreen, DormInfoScreen,
  RollCallRulesScreen, DormRulesScreen,
} from '../features/checklist';
import { MembersScreen, RoommateHistoryScreen } from '../features/members';
import { ApplicantsListScreen, RoomChecklistScreen, EditPostScreen } from '../features/my-room';
import { ChecklistFilterScreen } from '../features/checklist';
import {
  HomeGuestScreen, FindRoomGuestScreen, MyRoomGuestScreen,
  ChatGuestScreen, MyPageGuestScreen,
} from '../features/guest';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PhoneFrameLayout />}>
        {/* Onboarding */}
        <Route path="/" element={<SplashScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignUpScreen />} />
        <Route path="/find-password" element={<FindPasswordScreen />} />
        <Route path="/terms/:slug" element={<TermsDetailScreen />} />

        {/* Main tabs */}
        <Route path="/home" element={<HomeScreen activeTab="home" />} />
        <Route path="/rooms/find" element={<FindRoomScreen activeTab="find" />} />
        <Route path="/rooms/me" element={<MyRoomScreen activeTab="myroom" />} />
        <Route path="/chat" element={<ChatListScreen activeTab="chat" />} />
        <Route path="/me" element={<MyPageScreen activeTab="me" />} />
        <Route path="/me/edit" element={<ProfileEditScreen />} />

        {/* Detail screens */}
        <Route path="/dorm-info" element={<DormInfoScreen />} />
        <Route path="/dorm-rules/rollcall" element={<RollCallRulesScreen />} />
        <Route path="/dorm-rules/general" element={<DormRulesScreen />} />
        <Route path="/rooms/:id" element={<RoomDetailScreen />} />
        <Route path="/rooms/:id/apply" element={<ApplyMessageScreen />} />
        <Route path="/chat/group" element={<ChatDetailScreen />} />
        <Route path="/chat/dm" element={<ChatDMScreen />} />

        {/* Flow screens */}
        <Route path="/checklist" element={<ChecklistEditScreen mode="personal" />} />
        <Route path="/rooms/create/1" element={<CreateRoomScreen />} />
        <Route path="/rooms/create/2" element={<ChecklistEditScreen mode="room" />} />
        <Route path="/rooms/create/3" element={<CreateRoomStep3Screen />} />
        <Route path="/rooms/create/success" element={<CreateRoomSuccessScreen />} />
        <Route path="/rooms/applicants" element={<ApplicantsListScreen />} />
        <Route path="/rooms/applicants/:id" element={<ApplicantDetailScreen />} />
        <Route path="/rooms/checklist" element={<RoomChecklistScreen />} />
        <Route path="/rooms/checklist/edit" element={<ChecklistEditScreen mode="roomEdit" />} />
        <Route path="/rooms/edit" element={<EditPostScreen />} />
        <Route path="/rooms/members" element={<MembersScreen />} />
        <Route path="/my/roommates" element={<RoommateHistoryScreen />} />
        <Route path="/apply/success" element={<ApplySuccessScreen />} />
        <Route path="/my/applications" element={<MyApplicationsScreen />} />
        <Route path="/my/bookmarks" element={<BookmarksScreen />} />

        {/* Search & recommend */}
        <Route path="/rooms/find/recommended" element={<RecommendedRoomsScreen />} />
        <Route path="/rooms/find/filter" element={<ChecklistFilterScreen />} />

        {/* Comms */}
        <Route path="/notices" element={<NoticeListScreen />} />
        <Route path="/notice/:id" element={<NoticeDetailScreen />} />
        <Route path="/notifications" element={<NotificationsScreen />} />
        <Route path="/settings/notifications" element={<NotificationSettingsScreen />} />
        <Route path="/settings/account" element={<AccountSettingsScreen />} />
        <Route path="/settings/account/delete" element={<DeleteAccountScreen />} />
        <Route path="/settings/support" element={<SupportScreen />} />

        {/* Guest mode */}
        <Route path="/guest" element={<HomeGuestScreen />} />
        <Route path="/guest/rooms/find" element={<FindRoomGuestScreen />} />
        <Route path="/guest/myroom" element={<MyRoomGuestScreen />} />
        <Route path="/guest/chat" element={<ChatGuestScreen />} />
        <Route path="/guest/me" element={<MyPageGuestScreen />} />
      </Route>

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
