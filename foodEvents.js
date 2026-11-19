import { renderFoods } from './foodView';

// 食品関連のイベント登録
export function bindFoodEvents({ state, actions }) {
  const {
    handleAddFood,
    handleUpdateFood,
    handleDeleteFood,
    handleAddShoppingItem
  } = actions;

  // 食品フィルターの切り替え
  document.querySelectorAll('.filter').forEach(button => {
    button.addEventListener('click', () => {
      state.currentFilter = button.dataset.filter;
      actions.render();
    });
  });

  // 食品検索
  const searchInput = document.querySelector('#search');

  if (searchInput) {
    searchInput.addEventListener('input', event => {
      renderFoods(
        state.foods,
        state.currentFilter,
        state.upcomingMeals,
        event.target.value,
        state.hideNoStock
      );
    });
  }

  // 在庫なし食品の表示切り替え
  const hideNoStockCheckbox =
    document.querySelector('#hide-no-stock');

  if (hideNoStockCheckbox) {
    hideNoStockCheckbox.checked = state.hideNoStock;

    hideNoStockCheckbox.addEventListener('change', event => {
      state.hideNoStock = event.target.checked;

      renderFoods(
        state.foods,
        state.currentFilter,
        state.upcomingMeals,
        searchInput ? searchInput.value : '',
        state.hideNoStock
      );
    });
  }

  // 食品追加ボタン
  const addButton = document.querySelector('#add-button');

  if (addButton) {
    addButton.addEventListener('click', () => {
      const modal = document.querySelector('#modal');
      const deleteFoodButton = document.querySelector('#delete-food-button');
      if (deleteFoodButton) {
        deleteFoodButton.hidden = true;
      }
      if (modal) {
        modal.classList.remove('hidden');
      }
    });
  }

  // 食品モーダルの3点メニュー
  const foodMenuButton = document.querySelector('#food-menu-button');
  const foodMenu = document.querySelector('#food-menu');

  if (foodMenuButton && foodMenu) {
    foodMenuButton.addEventListener('click', event => {
      event.stopPropagation();
      foodMenu.classList.toggle('hidden');
    });

    // メニュー以外をクリックしたら閉じる
    document.addEventListener('click', event => {
      if (
        !foodMenu.contains(event.target) &&
        !foodMenuButton.contains(event.target)
      ) {
        foodMenu.classList.add('hidden');
      }
    });
  }

  // 食品モーダルの背景クリックで閉じる
  const foodModal = document.querySelector('#modal');

  if (foodModal) {
    foodModal.addEventListener('click', event => {
      // モーダル本体をクリックした場合は閉じない
      if (event.target !== foodModal) return;

      state.editingFoodId = null;

      document.querySelector('#food-form').reset();
      document.querySelector('.modal-header h2').textContent = '食品を追加';
      document.querySelector('.submit-button').textContent = '登録する';

      foodMenu?.classList.add('hidden');
      foodModal.classList.add('hidden');
    });
  }

  // 食品の新規登録・編集
  const foodForm = document.querySelector('#food-form');

  if (foodForm) {
    foodForm.addEventListener('submit', async event => {
      event.preventDefault();

      const form = new FormData(event.target);

      const foodData = {
        name: form.get('food-name'),
        stockStatus: form.get('stock-status'),
        place: form.get('place'),
        expiryDate: form.get('expiry-date')
      };

      if (state.editingFoodId) {
        await handleUpdateFood(state.editingFoodId, foodData);
      } else {
        await handleAddFood(foodData);
      }

      state.editingFoodId = null;

      const modalTitle = document.querySelector('.modal-header h2');
      const submitButton = document.querySelector('.submit-button');

      if (modalTitle) {
        modalTitle.textContent = '食品を追加';
      }

      if (submitButton) {
        submitButton.textContent = '登録する';
      }
    });
  }

  const foodList = document.querySelector('#food-list');

  // 食品カードをクリックして編集
  if (foodList) {
    foodList.addEventListener('click', event => {
      // カード内のボタンや操作部分を押した場合は編集しない
      if (event.target.closest('button')) return;

      const card = event.target.closest('.food-card');

      if (!card) return;

      const foodId = card.dataset.id;
      const food = state.foods.find(item => item.id === foodId);

      if (!food) return;

      state.editingFoodId = foodId;

      const form = document.querySelector('#food-form');
      const modal = document.querySelector('#modal');
      const modalTitle = document.querySelector('.modal-header h2');
      const submitButton = document.querySelector('.submit-button');

      if (!form || !modal || !modalTitle || !submitButton) {
        return;
      }

      form.elements.namedItem('food-name').value = food.name;
      form.elements.namedItem('stock-status').value = food.stockStatus || '在庫あり';
      form.elements.namedItem('place').value = food.place;
      form.elements.namedItem('expiry-date').value = food.expiryDate;

      modalTitle.textContent = '食品を編集';
      submitButton.textContent = '更新する';
      const deleteFoodButton = document.querySelector('#delete-food-button');

      if (deleteFoodButton) {
        deleteFoodButton.hidden = false;
      }

      modal.classList.remove('hidden');
    });
  }

  // 編集モーダル内の食品削除
  const deleteFoodButton = document.querySelector('#delete-food-button');

  if (deleteFoodButton) {
    deleteFoodButton.addEventListener('click', async () => {
      if (!state.editingFoodId) return;

      const deleted = await handleDeleteFood(state.editingFoodId);

      if (deleted) {
        state.editingFoodId = null;

        document.querySelector('#food-form').reset();
        document.querySelector('.modal-header h2').textContent = '食品を追加';
        document.querySelector('.submit-button').textContent = '登録する';

        foodMenu.classList.add('hidden');
        document.querySelector('#modal').classList.add('hidden');
      }
    });
  }

  // 食品リストから買い物リストに追加
  if (foodList) {
    foodList.addEventListener('click', async event => {
      const button = event.target.closest('.add-to-shopping-button');

      if (!button) return;

      const foodId = button.dataset.id;
      const food = state.foods.find(item => item.id === foodId);

      if (!food) return;

      const confirmed = confirm(
        `${food.name}を買い物リストに追加しますか？`
      );

      if (!confirmed) return;

      await handleAddShoppingItem({
        name: food.name,
        quantity: ''
      });

      alert(`${food.name}を買い物リストに追加しました。`);
    });
  }
}
