import {
  fetchFoods,
  createFoodData,
  removeFoodData
} from './dataController';

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

// 食品を追加
export async function handleAddFood({
  currentUser,
  currentHouseholdId,
  newFood,
  loadFoods
}) {
  if (!currentUser) {
    console.error('ユーザー認証が完了していません');
    return;
  }

  try {
    await createFoodData(currentHouseholdId, newFood);

    console.log('食品を保存しました');

    // フォームをリセット
    document.querySelector('#food-form').reset();

    // 最新の食品一覧を取得して画面更新
    await loadFoods();

  } catch (error) {
    console.error('食品の保存に失敗しました:', error);
    alert('食品を保存できませんでした');
  }
}

// 食品の削除
export async function handleDeleteFood({
  currentUser,
  currentHouseholdId,
  foodId,
  loadFoods
}) {
  if (!currentUser) {
    console.error('ユーザー認証が完了していません');
    return;
  }

  // 削除前に確認
  const confirmed = confirm('この食品を削除しますか？');

  if (!confirmed) {
    return;
  }

  try {
    await removeFoodData(currentHouseholdId, foodId);

    console.log('食品を削除しました');

    // 最新の食品一覧を取得
    await loadFoods();

  } catch (error) {
    console.error('食品の削除に失敗しました:', error);
    alert('食品を削除できませんでした');
  }
}
