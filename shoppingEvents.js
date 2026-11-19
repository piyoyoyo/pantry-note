export function bindShoppingEvents({ state, actions }) {
  const {
    handleAddShoppingItem,
    handleUpdateShoppingStatus,
    handleUpdateShoppingItem
  } = actions;

  // 商品追加フォーム
  const shoppingForm = document.querySelector('#shopping-form');

  if (shoppingForm) {
    shoppingForm.addEventListener('submit', async event => {
      event.preventDefault();

      const name = document.querySelector('#shopping-name').value.trim();
      const quantity = document.querySelector('#shopping-quantity').value.trim();

      if (!name) {
        alert('商品名を入力してください');
        return;
      }

      await handleAddShoppingItem({
        name,
        quantity
      });
    });
  }

  // 購入チェックボックス
  const shoppingLists = [
    document.querySelector('#shopping-list'),
    document.querySelector('#purchased-list')
  ];

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

  // 商品編集モーダル
  const editModal = document.querySelector('#shopping-edit-modal');
  const editForm = document.querySelector('#shopping-edit-form');
  const editNameInput = document.querySelector('#shopping-edit-name');
  const editQuantityInput = document.querySelector('#shopping-edit-quantity');

  let editingShoppingItemId = null;

  // モーダルを閉じる
  function closeShoppingEditModal() {
    editModal.hidden = true;
    editingShoppingItemId = null;
  }

  shoppingLists.forEach(list => {
    if (!list) return;

    list.addEventListener('click', event => {
      const editButton = event.target.closest('.shopping-edit-button');

      if (!editButton) return;

      const itemId = editButton.dataset.id;

      const item = state.shoppingItems.find(
        item => item.id === itemId
      );

      if (!item) return;

      editingShoppingItemId = itemId;

      editNameInput.value = item.name;
      editQuantityInput.value = item.quantity || '';

      editModal.hidden = false;
      editNameInput.focus();
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

      if (!editingShoppingItemId) return;

      await handleUpdateShoppingItem({
        itemId: editingShoppingItemId,
        updatedItem: {
          name,
          quantity
        }
      });

      closeShoppingEditModal();
    });
  }

  // キャンセル・閉じるボタン
  document.querySelector('#close-shopping-edit')
    ?.addEventListener('click', closeShoppingEditModal);

  document.querySelector('#cancel-shopping-edit')
    ?.addEventListener('click', closeShoppingEditModal);

  // 背景部分をクリックして閉じる
  editModal?.addEventListener('click', event => {
    if (event.target === editModal) {
      closeShoppingEditModal();
    }
  });
}
