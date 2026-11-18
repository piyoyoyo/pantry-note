import liff from '@line/liff';
import { initializeAuth, functions } from './firebase';
import {
  getUserHousehold,
  getHouseholdName
} from './households';
import { httpsCallable } from 'firebase/functions';

// アプリの初期化
export async function initializeAppServices() {

  // LIFFの初期化
  try {
    await liff.init({
      liffId: import.meta.env.VITE_LIFF_ID
    });

    console.log('LIFF initialized');

  } catch (error) {
    console.error('LIFF error:', error);
  }

  // Firebase認証
  const currentUser = await initializeAuth();

  console.log('Firebase authentication success!');
  console.log('User ID:', currentUser.uid);

  // 招待URLのパラメータを取得
  const params = new URLSearchParams(window.location.search);

  const inviteToken = params.get('invite');
  const inviteHouseholdId = params.get('householdId');

  // 招待URLからアクセスした場合
  if (inviteToken || inviteHouseholdId) {

    if (!inviteToken || !inviteHouseholdId) {
      throw new Error('招待URLの情報が不足しています。');
    }

    const acceptInviteCallable =
      httpsCallable(functions, 'acceptInvite');

    await acceptInviteCallable({
      householdId: inviteHouseholdId,
      token: inviteToken
    });

    // URLから招待情報を削除
    const url = new URL(window.location.href);
    url.searchParams.delete('invite');
    url.searchParams.delete('householdId');

    window.history.replaceState(
      {},
      '',
      url.pathname + url.search + url.hash
    );

    alert('家への参加が完了しました！');
  }

  // 所属している家を取得
  const currentHouseholdId =
    await getUserHousehold(currentUser.uid);

  console.log('Household ID:', currentHouseholdId);

  // 家の名前を取得
  let currentHouseholdName = '';

  if (currentHouseholdId) {
    currentHouseholdName =
      await getHouseholdName(currentHouseholdId);

    console.log('Household Name:', currentHouseholdName);
  }

  return {
    currentUser,
    currentHouseholdId,
    currentHouseholdName
  };
}