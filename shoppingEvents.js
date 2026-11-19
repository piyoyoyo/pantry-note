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

  // 商品編集ボタン
  shoppingLists.forEach(list => {
    if (!list) return;

    list.addEventListener('click', async event => {
      const editButton = event.target.closest('.shopping-edit-button');

      if (!editButton) return;

      const itemId = editButton.dataset.id;

      const item = state.shoppingItems.find(
        item => item.id === itemId
      );

      if (!item) return;

      // 商品名を入力
      const name = prompt('商品名を入力してください', item.name);

      if (name === null) return;

      if (!name.trim()) {
        alert('商品名を入力してください');
        return;
      }

      // 数量を入力
      const quantity = prompt(
        '数量を入力してください（任意）',
        item.quantity || ''
      );

      if (quantity === null) return;

      await handleUpdateShoppingItem({
        itemId,
        updatedItem: {
          name: name.trim(),
          quantity: quantity.trim()
        }
      });
    });
  });
}
