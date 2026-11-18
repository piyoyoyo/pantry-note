import {
  fetchShoppingItems,
  createShoppingItemData,
  updateShoppingStatusData
} from './dataController';

// Firestoreから買い物リストを取得して画面を更新
export async function loadShoppingItems({
  currentUser,
  currentHouseholdId,
  setShoppingItems,
  render
}) {
  if (!currentUser) {
    console.error('ユーザー認証が完了していません');
    return;
  }

  try {
    const items = await fetchShoppingItems(currentHouseholdId);

    setShoppingItems(items);
    render();

    console.log('買い物リストの取得に成功しました:', items);

  } catch (error) {
    console.error('買い物リストの取得に失敗しました:', error);
  }
}

// 買い物リストに商品を追加
export async function handleAddShoppingItem({
  currentUser,
  currentHouseholdId,
  newItem,
  loadShoppingItems
}) {
  if (!currentUser) {
    console.error('ユーザー認証が完了していません');
    return;
  }

  try {
    await createShoppingItemData(currentHouseholdId, newItem);

    console.log('買い物リストに商品を追加しました');

    // フォームをリセット
    document.querySelector('#shopping-form').reset();

    // 最新の買い物リストを取得
    await loadShoppingItems();

  } catch (error) {
    console.error('商品の追加に失敗しました:', error);
    alert('商品を追加できませんでした');
  }
}

// 商品の購入状態を更新
export async function handleUpdateShoppingStatus({
  currentUser,
  currentHouseholdId,
  itemId,
  isPurchased,
  loadShoppingItems
}) {
  if (!currentUser) {
    console.error('ユーザー認証が完了していません');
    return;
  }

  try {
    await updateShoppingStatusData(
      currentHouseholdId,
      itemId,
      isPurchased
    );

    console.log('商品の購入状態を更新しました');

    // 最新の買い物リストを取得
    await loadShoppingItems();

  } catch (error) {
    console.error('購入状態の更新に失敗しました:', error);
    alert('購入状態を更新できませんでした');
  }
}
