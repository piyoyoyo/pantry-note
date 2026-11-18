import { bindFoodEvents } from './foodEvents';

export function bindEvents({ state, actions }) {
  const {
    render,
    handleCreateInvite,
    changeMealDate,
    loadMeals,
    openMealModal,
    handleSaveMeal,
    handleDeleteMeal
  } = actions;

  // 食品関連のイベント登録
  bindFoodEvents({
    state,
    actions
  });

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
  const inviteButton = document.querySelector('#invite-button');

  if (inviteButton) {
    inviteButton.addEventListener('click', () => {
      if (settingsMenu) {
        settingsMenu.classList.add('hidden');
      }

      handleCreateInvite();
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

        const meal = state.meals.find(item => item.id === mealId);

        if (!meal) return;

        openMealModal(meal.type, meal);
      });
    });

  // 献立名の入力値を保持
  const mealNameInput = document.querySelector('#meal-name');

  if (mealNameInput) {
    mealNameInput.addEventListener('input', event => {
      state.mealNameInput = event.target.value;
    });
  }

  // レシピURLの入力値を保持
  const mealRecipeUrlInput = document.querySelector('#meal-recipe-url');

  if (mealRecipeUrlInput) {
    mealRecipeUrlInput.addEventListener('input', event => {
      state.mealRecipeUrlInput = event.target.value;
    });
  }

  // レシピをWebで検索
  const recipeSearchButton = document.querySelector('#recipe-search-button');

  if (recipeSearchButton) {
    recipeSearchButton.addEventListener('click', () => {
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
  }

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
  const mealForm = document.querySelector('#meal-form');

  if (mealForm) {
    mealForm.addEventListener('submit', async event => {
      event.preventDefault();

      const mealName = state.mealNameInput.trim();

      if (!mealName) {
        alert('献立名を入力してください。');
        return;
      }

      await handleSaveMeal(mealName, state.mealRecipeUrlInput);
    });
  }

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
  const closeMealModalButton = document.querySelector('#close-meal-modal');

  if (closeMealModalButton) {
    closeMealModalButton.addEventListener('click', closeMealModal);
  }

  // キャンセルボタン
  const cancelMealModalButton = document.querySelector('#cancel-meal-modal');

  if (cancelMealModalButton) {
    cancelMealModalButton.addEventListener('click', closeMealModal);
  }

  // 献立の削除
  document.querySelectorAll('.meal-delete-button')
    .forEach(button => {
      button.addEventListener('click', () => {
        handleDeleteMeal(button.dataset.id);
      });
    });
}

// 家の作成フォームのイベント登録
export function bindHouseholdEvents({ handleCreateHousehold }) {
  const householdForm = document.querySelector('#household-form');

  if (!householdForm) return;

  householdForm.addEventListener('submit', async event => {
    event.preventDefault();

    const householdName = new FormData(event.target)
      .get('household-name')
      .trim();

    if (!householdName) {
      alert('家の名前を入力してください');
      return;
    }

    await handleCreateHousehold(householdName);
  });
}
