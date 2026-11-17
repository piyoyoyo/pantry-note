
import {
  collection,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
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

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// 献立を追加
export async function addMeal(householdId, meal) {
  const mealsRef = getMealsCollection(householdId);

  const docRef = await addDoc(mealsRef, {
    date: meal.date,
    type: meal.type,
    name: meal.name,
    createdAt: serverTimestamp()
  });

  return docRef.id;
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
