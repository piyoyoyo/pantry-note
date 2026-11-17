import { renderFoods } from './foodView';

export function bindEvents({ state, actions }) {
  const {
    render,
    handleCreateInvite,
    handleAddFood,
    handleUpdateFood,
    handleDeleteFood,
    changeMealDate,
    loadMeals,
    openMealModal,
    handleSaveMeal,
    handleDeleteMeal
  } = actions;

  // 設定メニューの開閉
  const settingsButton = document.querySelector('#settings-button');
  const settingsMenu = document.querySelector('#settings-menu');

  if (settingsButton && settingsMenu) {
    settingsButton.addEventListener('click', () => {
      settingsMenu.classList.toggle('hidden');
    });
  }
  // 下部ナビゲーションのタブ切り替え
  document.querySelectorAll('.nav-item').forEach(button => {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab;

      if (state.currentTab === tab) return;

      state.currentTab = tab;
      render();
    });
  });

  // 家族招待ボタン
  document.querySelector('#invite-button')
    .addEventListener('click', () => {
      settingsMenu.classList.add('hidden');
      handleCreateInvite();
    });

  document.querySelectorAll('.filter').forEach(button => {
    button.addEventListener('click', () => {
      state.currentFilter = button.dataset.filter;
      render();
    });
  });

  const searchInput = document.querySelector('#search');

  if (searchInput) {
    searchInput.addEventListener('input', event => {
      renderFoods(
        state.foods,
        state.currentFilter,
        state.upcomingMeals,
        event.target.value
      );
    });
  }

  // 食品追加するボタンを押してモーダルを開く
  const addButton = document.querySelector('#add-button');

  if (addButton) {
    addButton.addEventListener('click', () => {
      const modal = document.querySelector('#modal');

      if (modal) {
        modal.classList.remove('hidden');
      }
    });
  }

  const closeFoodModalButton = document.querySelector('#close-modal');

  if (closeFoodModalButton) {
    closeFoodModalButton.addEventListener('click', () => {
      state.editingFoodId = null;

      document.querySelector('#food-form').reset();
      document.querySelector('.modal-header h2').textContent = '食品を追加';
      document.querySelector('.submit-button').textContent = '登録する';

      document.querySelector('#modal').classList.add('hidden');
    });
  }

  // 「食材を追加」モーダルで登録ボタンを押したときと、食品一覧で編集ボタンを押した時の処理
  const foodForm = document.querySelector('#food-form');

  if (foodForm) {
    foodForm.addEventListener('submit', async event => {
      event.preventDefault();

      const form = new FormData(event.target);

      // フォームから入力値を取得
      const foodData = {
        name: form.get('food-name'),
        quantity: form.get('quantity'),
        place: form.get('place'),
        expiryDate: form.get('expiry-date')
      };

      if (state.editingFoodId) {
        // 編集モード：既存食品を更新
        await handleUpdateFood(state.editingFoodId, foodData);
      } else {
        // 新規登録モード：食品を追加
        await handleAddFood(foodData);
      }

      // モーダルの表示を初期状態に戻す
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

  // 食品一覧のクリックイベント
  const foodList = document.querySelector('#food-list');

  if (foodList) {
    foodList.addEventListener('click', event => {
      const button = event.target.closest('.delete-button');

      if (!button) {
        return;
      }

      const foodId = button.dataset.id;

      handleDeleteFood(foodId);
    });
  }

  // 食品編集ボタン
  const foodListForEdit = document.querySelector('#food-list');

  if (foodListForEdit) {
    foodListForEdit.addEventListener('click', event => {
      const button = event.target.closest('.edit-button');

      if (!button) {
        return;
      }

      const foodId = button.dataset.id;

      // 編集対象の食品を取得
      const food = state.foods.find(item => item.id === foodId);

      if (!food) {
        return;
      }

      // 編集モードにする
      state.editingFoodId = foodId;

      // フォームを取得
      const form = document.querySelector('#food-form');
      const modal = document.querySelector('#modal');
      const modalTitle = document.querySelector('.modal-header h2');
      const submitButton = document.querySelector('.submit-button');

      if (!form || !modal || !modalTitle || !submitButton) {
        return;
      }

      // フォームに既存の値をセット
      form.elements.namedItem('food-name').value = food.name;
      form.elements.namedItem('quantity').value = food.quantity;
      form.elements.namedItem('place').value = food.place;
      form.elements.namedItem('expiry-date').value = food.expiryDate;

      // モーダルのタイトルとボタンを変更
      modalTitle.textContent = '食品を編集';
      submitButton.textContent = '更新する';

      // モーダルを表示
      modal.classList.remove('hidden');
    });
  }

  // 献立の日付切り替え
  const previousMealDateButton = document.querySelector('#previous-meal-date');

  if (previousMealDateButton) {
    previousMealDateButton.addEventListener('click', () => {
      changeMealDate(-1);
    });
  }

  // 今日へ戻る
  const todayMealDateButton = document.querySelector('#today-meal-date');

  if (todayMealDateButton) {
    todayMealDateButton.addEventListener('click', async () => {
      state.selectedMealDate = new Date();
      state.selectedMealDate.setHours(0, 0, 0, 0);

      state.currentMealType = null;

      await loadMeals();
    });
  }

  // 翌日へ
  const nextMealDateButton = document.querySelector('#next-meal-date');

  if (nextMealDateButton) {
    nextMealDateButton.addEventListener('click', () => {
      changeMealDate(1);
    });
  }

  // 献立の追加ボタン
  document.querySelectorAll('.meal-add-button')
    .forEach(button => {
      button.addEventListener('click', () => {
        openMealModal(button.dataset.type);
      });
    }); 

  // 登録済み献立をクリックして編集モーダルを開く
  document.querySelectorAll('.meal-name-button')
    .forEach(button => {
      button.addEventListener('click', () => {
        const mealId = button.dataset.id;

        // クリックされた献立を取得
        const meal = state.meals.find(item => item.id === mealId);

        if (!meal) {
          return;
        }

        // 編集モーダルを開く
        openMealModal(meal.type, meal);
      });
    });

  // 献立名の入力値を保持
  document.querySelector('#meal-name')
    .addEventListener('input', event => {
      state.mealNameInput = event.target.value;
    });

  // レシピURLの入力値を保持
  document.querySelector('#meal-recipe-url')
    .addEventListener('input', event => {
      state.mealRecipeUrlInput = event.target.value;
    });

  // レシピをWebで検索
  document.querySelector('#recipe-search-button')
    .addEventListener('click', () => {
      const mealName = state.mealNameInput.trim();

      if (!mealName) {
        alert('先に献立名を入力してください。');
        document.querySelector('#meal-name').focus();
        return;
      }

      const searchUrl =
        `https://www.google.com/search?q=${encodeURIComponent(mealName + ' レシピ')}`;

      window.open(searchUrl, '_blank', 'noopener,noreferrer');
    });

  // 材料タブの切り替え
  document.querySelectorAll('.ingredient-filter')
    .forEach(button => {
      button.addEventListener('click', () => {
        state.ingredientFilter = button.dataset.filter;
        render();
      });
    });

  // 材料タグの選択・解除
  document.querySelectorAll('.ingredient-tag')
    .forEach(button => {
      button.addEventListener('click', () => {
        const foodId = button.dataset.id;

        if (state.selectedIngredientIds.includes(foodId)) {
          state.selectedIngredientIds =
            state.selectedIngredientIds.filter(id => id !== foodId);
        } else {
          state.selectedIngredientIds.push(foodId);
        }

        render();
      });
    });

  // 献立の保存
  document.querySelector('#meal-form')
    .addEventListener('submit', async event => {
      event.preventDefault();

      const mealName = state.mealNameInput.trim();

      if (!mealName) {
        alert('献立名を入力してください。');
        return;
      }

      await handleSaveMeal(mealName, state.mealRecipeUrlInput);
    });

  // モーダルを閉じる共通処理
  function closeMealModal() {
    state.editingMealId = null;
    state.currentMealType = null;
    state.selectedIngredientIds = [];
    state.mealNameInput = '';
    state.mealRecipeUrlInput = '';
    state.isMealModalOpen = false;

    render();
  }

  // 閉じるボタン
  document.querySelector('#close-meal-modal')
    .addEventListener('click', closeMealModal);

  // キャンセルボタン
  document.querySelector('#cancel-meal-modal')
    .addEventListener('click', closeMealModal);

  // 献立の削除
  document.querySelectorAll('.meal-delete-button')
    .forEach(button => {
      button.addEventListener('click', () => {
        handleDeleteMeal(button.dataset.id);
      });
    });
}