const { setGlobalOptions } = require("firebase-functions");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const { randomBytes } = require("node:crypto");

initializeApp();

const db = getFirestore();

// 関数の実行リージョンと同時実行数の上限
setGlobalOptions({
  region: "asia-northeast1",
  maxInstances: 5
});

// 招待トークンを発行する
exports.createInvite = onCall(async (request) => {
  // Firebase認証を確認
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "ログインが必要です。"
    );
  }

  const userId = request.auth.uid;
  const householdId = request.data.householdId;

  if (
    typeof householdId !== "string" ||
    householdId.length === 0
  ) {
    throw new HttpsError(
      "invalid-argument",
      "家のIDが正しくありません。"
    );
  }

  // 家のメンバー情報を取得
  const memberRef = db
    .collection("households")
    .doc(householdId)
    .collection("members")
    .doc(userId);

  const memberSnapshot = await memberRef.get();

  // 管理者かどうか確認
  if (
    !memberSnapshot.exists ||
    memberSnapshot.data().role !== "owner"
  ) {
    throw new HttpsError(
      "permission-denied",
      "招待URLを発行できるのは家の管理者だけです。"
    );
  }

  // 32バイトのランダムな招待トークンを生成
  const token = randomBytes(32).toString("hex");

  // 有効期限は7日後
  const expiresAt = Timestamp.fromMillis(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  );

  // 招待情報をFirestoreに保存
  const inviteRef = db
    .collection("households")
    .doc(householdId)
    .collection("invites")
    .doc(token);

  await inviteRef.set({
    createdBy: userId,
    createdAt: Timestamp.now(),
    expiresAt: expiresAt,
    maxUses: 1,
    usedCount: 0
  });

  // フロントエンドにトークンを返す
  return {
    token: token,
    expiresAt: expiresAt.toMillis()
  };
});
