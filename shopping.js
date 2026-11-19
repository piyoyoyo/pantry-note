import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';

import { db } from './firebase';

// 家ごとの買い物リストコレクションを取得
function getShoppingCollection(householdId) {
  return collection(db, 'households', householdId, 'shoppingItems');
}

// 買い物リストを取得
export async function getShoppingItems(householdId) {
  const shoppingRef = getShoppingCollection(householdId);
  const q = query(shoppingRef, orderBy('createdAt', 'desc'));

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

// 買い物リストに商品を追加
export async function addShoppingItem(householdId, item) {
  const shoppingRef = getShoppingCollection(householdId);

  const docRef = await addDoc(shoppingRef, {
    name: item.name,
    quantity: item.quantity || '',
    isPurchased: false,
    createdAt: serverTimestamp()
  });

  return docRef.id;
}

// 買い物リストの商品を削除
export async function deleteShoppingItem(householdId, itemId) {
  const itemRef = doc(
    db,
    'households',
    householdId,
    'shoppingItems',
    itemId
  );

  await deleteDoc(itemRef);
}

// 買い物リストの商品情報を更新
export async function updateShoppingItem(householdId, itemId, item) {
  const itemRef = doc(
    db,
    'households',
    householdId,
    'shoppingItems',
    itemId
  );

  await updateDoc(itemRef, {
    name: item.name,
    quantity: item.quantity || ''
  });
}

// 購入状態を更新
export async function updateShoppingItemStatus(householdId, itemId, isPurchased) {
  const itemRef = doc(
    db,
    'households',
    householdId,
    'shoppingItems',
    itemId
  );

  await updateDoc(itemRef, {
    isPurchased
  });
}

// 購入済み商品をまとめて削除
export async function deletePurchasedShoppingItems(householdId) {
  const shoppingRef = getShoppingCollection(householdId);
  const q = query(shoppingRef);

  const snapshot = await getDocs(q);

  const batch = writeBatch(db);

  let deleteCount = 0;

  snapshot.docs.forEach(itemDoc => {
    if (itemDoc.data().isPurchased) {
      batch.delete(itemDoc.ref);
      deleteCount++;
    }
  });

  if (deleteCount > 0) {
    await batch.commit();
  }

  return deleteCount;
}
