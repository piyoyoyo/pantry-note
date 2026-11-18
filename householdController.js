import { createHousehold } from './households';
import { functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

// 家を作成
export async function handleCreateHousehold({
  currentUser,
  householdName,
  setCurrentHouseholdId,
  setCurrentHouseholdName,
  loadFoods
}) {
  if (!currentUser) {
    alert('ログインが完了していません');
    return;
  }

  try {
    const householdId = await createHousehold(
      currentUser.uid,
      householdName
    );

    // 作成した家のIDと名前を保存
    setCurrentHouseholdId(householdId);
    setCurrentHouseholdName(householdName);

    console.log('家を作成しました:', householdId);

    // 食品管理画面へ切り替え
    await loadFoods();

    alert('家を作成しました！');

  } catch (error) {
    console.error('家の作成に失敗しました:', error);
    alert('家を作成できませんでした');
  }
}

// 招待URLを発行
export async function handleCreateInvite({
  currentHouseholdId
}) {
  try {
    if (!currentHouseholdId) {
      alert('家の情報が取得できていません。');
      return;
    }

    const createInvite = httpsCallable(functions, 'createInvite');

    const result = await createInvite({
      householdId: currentHouseholdId
    });

    const token = result.data.token;

    const inviteUrl =
      `https://liff.line.me/${import.meta.env.VITE_LIFF_ID}?invite=${encodeURIComponent(token)}&householdId=${encodeURIComponent(currentHouseholdId)}`;

    await navigator.clipboard.writeText(inviteUrl);

    alert('招待URLをコピーしました！\n有効期限は発行から7日間です。');

  } catch (error) {
    console.error('招待URLの発行に失敗しました:', error);
    alert('招待URLの発行に失敗しました。');
  }
}
