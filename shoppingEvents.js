export function bindShoppingEvents({ state, actions }) {
  const {
    handleAddShoppingItem,
    handleUpdateShoppingStatus,
    handleUpdateShoppingItem,
    handleDeleteShoppingItem,
    handleClearPurchasedShoppingItems
  } = actions;

  const shoppingLists = [
    document.querySelector('#shopping-list'),
    document.querySelector('#purchased-list')
  ];

  // 購入チェックボックス
  shoppingLists.forEach(list => {
    if (!list) return;

    list.addEventListener('change', async event => {
      if (!event.target.matches('.shopping-check-button')) return;

      const itemId = event.target.dataset.id;
      const isPurchased = event.target.checked;

      await handleUpdateShoppingStatus({
        itemId,
        isPurchased
      });
    });
  });

    // 商品追加・編集モーダル
  const editModal = document.querySelector('#shopping-edit-modal');
  const editForm = document.querySelector('#shopping-edit-form');
  const editNameInput = document.querySelector('#shopping-edit-name');
  const editQuantityInput = document.querySelector('#shopping-edit-quantity');

  let editingShoppingItemId = null;

  // モーダルを開く
  function openShoppingModal(item = null) {
    editingShoppingItemId = item ? item.id : null;

    editNameInput.value = item ? item.name : '';
    editQuantityInput.value = item ? (item.quantity || '') : '';

    editModal.hidden = false;
    editNameInput.focus();
  }

  // モーダルを閉じる
  function closeShoppingEditModal() {
    editModal.hidden = true;
    editingShoppingItemId = null;
    editForm.reset();
  }

  // 新規追加ボタン
  document.querySelector('#open-shopping-add')
    ?.addEventListener('click', () => {
      openShoppingModal();
    });

  // 編集ボタン
  shoppingLists.forEach(list => {
    if (!list) return;

    list.addEventListener('click', event => {
      const editButton = event.target.closest('.shopping-edit-button');

      if (!editButton) return;

      const item = state.shoppingItems.find(
        item => item.id === editButton.dataset.id
      );

      if (!item) return;

      openShoppingModal(item);
    });
  });

  // 保存ボタン
  if (editForm) {
    editForm.addEventListener('submit', async event => {
      event.preventDefault();

      const name = editNameInput.value.trim();
      const quantity = editQuantityInput.value.trim();

      if (!name) {
        alert('商品名を入力してください');
        return;
      }

      try {
        if (editingShoppingItemId) {
          // 商品編集
          await handleUpdateShoppingItem({
            itemId: editingShoppingItemId,
            updatedItem: { name, quantity }
          });
        } else {
          // 新規追加
          await handleAddShoppingItem({
            name,
            quantity
          });
        }

        closeShoppingEditModal();

      } catch (error) {
        console.error('商品の保存に失敗しました:', error);
      }
    });
  }

  // 閉じるボタン
  document.querySelector('#close-shopping-edit')
    ?.addEventListener('click', closeShoppingEditModal);

  document.querySelector('#cancel-shopping-edit')
    ?.addEventListener('click', closeShoppingEditModal);

  // 背景クリックで閉じる
  editModal?.addEventListener('click', event => {
    if (event.target === editModal) {
      closeShoppingEditModal();
    }
  });

  // 商品削除ボタン
  shoppingLists.forEach(list => {
    if (!list) return;

    list.addEventListener('click', async event => {
      const deleteButton = event.target.closest('.shopping-delete-button');

      if (!deleteButton) return;

      const itemId = deleteButton.dataset.id;

      const item = state.shoppingItems.find(
        item => item.id === itemId
      );

      if (!item) return;

      // 削除確認
      const confirmed = confirm(
        `「${item.name}」を削除しますか？`
      );

      if (!confirmed) return;

      await handleDeleteShoppingItem({
        itemId
      });
    });
  });

  // 購入済み商品をまとめて削除
  const clearPurchasedButton = document.querySelector(
    '#clear-purchased-button'
  );

  if (clearPurchasedButton) {
    clearPurchasedButton.addEventListener('click', async () => {
      // 購入済み商品があるか確認
      const purchasedItems = state.shoppingItems.filter(
        item => item.isPurchased
      );

      if (purchasedItems.length === 0) {
        alert('購入済みの商品はありません');
        return;
      }

      // 削除確認
      const confirmed = confirm(
        `購入済みの商品 ${purchasedItems.length}件をまとめて削除しますか？`
      );

      if (!confirmed) return;

      await handleClearPurchasedShoppingItems();
    });
  }
}
