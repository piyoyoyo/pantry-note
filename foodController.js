
import { fetchFoods } from './dataController';

// Firestoreから食品一覧を取得して画面を更新
export async function loadFoods({
  currentUser,
  currentHouseholdId,
  setFoods,
  render
}) {
  if (!currentUser) {
    console.error('ユーザー認証が完了していません');
    return;
  }

  try {
    const foods = await fetchFoods(currentHouseholdId);

    setFoods(foods);

    render();

    console.log('食品データの取得に成功しました:', foods);

  } catch (error) {
    console.error('食品データの取得に失敗しました:', error);
  }
}
