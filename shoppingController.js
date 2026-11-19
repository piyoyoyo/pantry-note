import {
  fetchShoppingItems,
  createShoppingItemData,
  updateShoppingStatusData,
  saveShoppingItemData,
  removeShoppingItemData,
  clearPurchasedShoppingItemsData
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

// 買い物リストの商品情報を更新
export async function handleUpdateShoppingItem({
  currentUser,
  currentHouseholdId,
  itemId,
  updatedItem,
  loadShoppingItems
}) {
  if (!currentUser) {
    console.error('ユーザー認証が完了していません');
    return;
  }

  try {
    await saveShoppingItemData(
      currentHouseholdId,
      itemId,
      updatedItem
    );

    console.log('商品情報を更新しました');

    // 最新の買い物リストを取得
    await loadShoppingItems();

  } catch (error) {
    console.error('商品の更新に失敗しました:', error);
    alert('商品を更新できませんでした');
  }
}

// 買い物リストの商品を削除
export async function handleDeleteShoppingItem({
  currentUser,
  currentHouseholdId,
  itemId,
  loadShoppingItems
}) {
  if (!currentUser) {
    console.error('ユーザー認証が完了していません');
    return;
  }

  try {
    await removeShoppingItemData(
      currentHouseholdId,
      itemId
    );

    console.log('商品を削除しました');

    // 最新の買い物リストを取得
    await loadShoppingItems();

  } catch (error) {
    console.error('商品の削除に失敗しました:', error);
    alert('商品を削除できませんでした');
  }
}

// 購入済み商品をまとめて削除
export async function handleClearPurchasedShoppingItems({
  currentUser,
  currentHouseholdId,
  loadShoppingItems
}) {
  if (!currentUser) {
    console.error('ユーザー認証が完了していません');
    return;
  }

  try {
    const deleteCount = await clearPurchasedShoppingItemsData(
      currentHouseholdId
    );

    console.log(`${deleteCount}件の購入済み商品を削除しました`);

    // 最新の買い物リストを取得
    await loadShoppingItems();

  } catch (error) {
    console.error('購入済み商品の一括削除に失敗しました:', error);
    alert('購入済み商品を削除できませんでした');
  }
}
