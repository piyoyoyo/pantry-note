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
  const shoppingMenuContainer = document.querySelector('.shopping-menu-container');
  const shoppingMenu = document.querySelector('#shopping-menu');

  let editingShoppingItemId = null;

  // 3点メニューの開閉
  const shoppingMenuButton = document.querySelector('#shopping-menu-button');

  if (shoppingMenuButton && shoppingMenu) {
    shoppingMenuButton.addEventListener('click', event => {
      event.stopPropagation();
      shoppingMenu.classList.toggle('hidden');
    });

    // メニュー以外をクリックしたら閉じる
    document.addEventListener('click', event => {
      if (
        !shoppingMenu.contains(event.target) &&
        !shoppingMenuButton.contains(event.target)
      ) {
        shoppingMenu.classList.add('hidden');
      }
    });
  }

  // モーダルを開く
  function openShoppingModal(item = null) {
    editingShoppingItemId = item ? item.id : null;

    editNameInput.value = item ? item.name : '';
    editQuantityInput.value = item ? (item.quantity || '') : '';

    // 新規追加時は3点メニューを非表示
    // 編集時は3点メニューを表示
    if (shoppingMenuContainer) {
      shoppingMenuContainer.classList.toggle('hidden', !item);
    }

    // メニューを閉じた状態にする
    shoppingMenu?.classList.add('hidden');

    editModal.hidden = false;
    editNameInput.focus();
  }

  // モーダルを閉じる
  function closeShoppingEditModal() {
    editModal.hidden = true;
    editingShoppingItemId = null;
    editForm.reset();

    shoppingMenuContainer?.classList.add('hidden');
    shoppingMenu?.classList.add('hidden');
  }

  // 新規追加ボタン
  document.querySelector('#open-shopping-add')
    ?.addEventListener('click', () => {
      openShoppingModal();
    });

  // 商品カードをクリックして編集
  shoppingLists.forEach(list => {
    if (!list) return;

    list.addEventListener('click', event => {
      // チェックボックスをクリックした場合は編集しない
      if (event.target.closest('.shopping-check-button')) return;

      const card = event.target.closest('.shopping-card');

      if (!card) return;

      const item = state.shoppingItems.find(
        item => item.id === card.dataset.id
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

  // 背景クリックで閉じる
  editModal?.addEventListener('click', event => {
    if (event.target === editModal) {
      closeShoppingEditModal();
    }
  });

  // 編集モーダル内の商品削除
  const deleteShoppingButton = document.querySelector('#delete-shopping-button');

  if (deleteShoppingButton) {
    deleteShoppingButton.addEventListener('click', async () => {
      if (!editingShoppingItemId) return;

      const item = state.shoppingItems.find(
        item => item.id === editingShoppingItemId
      );

      if (!item) return;

      const confirmed = confirm(
        `「${item.name}」を削除しますか？`
      );

      if (!confirmed) return;

      try {
        await handleDeleteShoppingItem({
          itemId: editingShoppingItemId
        });

        closeShoppingEditModal();

      } catch (error) {
        console.error('商品の削除に失敗しました:', error);
      }
    });
  }

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
