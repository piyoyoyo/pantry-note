import {
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

import { db } from './firebase';

// 家ごとの献立コレクション
function getMealsCollection(householdId) {
  return collection(
    db,
    'households',
    householdId,
    'meals'
  );
}

// 指定した日付の献立を取得
export async function getMeals(householdId, date) {
  const mealsRef = getMealsCollection(householdId);

  const q = query(
    mealsRef,
    where('date', '==', date),
    orderBy('createdAt', 'asc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(mealDoc => {
    const data = mealDoc.data();

    return {
      id: mealDoc.id,
      ...data,

      // 以前に登録した献立には材料IDがないため空配列にする
      ingredientIds: data.ingredientIds || [],

      // レシピURLも未登録の場合は空文字にする
      recipeUrl: data.recipeUrl || ''
    };
  });
}

// 今日以降の献立をすべて取得
export async function getUpcomingMeals(householdId, fromDate) {
  const mealsRef = getMealsCollection(householdId);

  const q = query(
    mealsRef,
    where('date', '>=', fromDate),
    orderBy('date', 'asc')
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(mealDoc => {
    const data = mealDoc.data();

    return {
      id: mealDoc.id,
      ...data,
      ingredientIds: data.ingredientIds || [],
      recipeUrl: data.recipeUrl || ''
    };
  });
}

// メニューを追加
export async function addMeal(householdId, meal) {
  const mealsRef = getMealsCollection(householdId);

  const docRef = await addDoc(mealsRef, {
    date: meal.date,
    type: meal.type,
    name: meal.name,
    ingredientIds: meal.ingredientIds || [],
    recipeUrl: meal.recipeUrl || '',
    createdAt: serverTimestamp()
  });

  return docRef.id;
}

// 献立を更新
export async function updateMeal(householdId, mealId, meal) {
  const mealRef = doc(
    db,
    'households',
    householdId,
    'meals',
    mealId
  );

  await updateDoc(mealRef, {
    date: meal.date,
    type: meal.type,
    name: meal.name,
    ingredientIds: meal.ingredientIds || [],
    recipeUrl: meal.recipeUrl || ''
  });
}

// 献立を削除
export async function deleteMeal(householdId, mealId) {
  const mealRef = doc(
    db,
    'households',
    householdId,
    'meals',
    mealId
  );

  await deleteDoc(mealRef);
}
