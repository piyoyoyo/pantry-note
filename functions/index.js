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

// 招待URLから家に参加する
exports.acceptInvite = onCall(async (request) => {
  // ログイン確認
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "ログインが必要です。"
    );
  }

  const userId = request.auth.uid;
  const householdId = request.data.householdId;
  const token = request.data.token;

  if (
    typeof householdId !== "string" ||
    typeof token !== "string" ||
    !householdId ||
    !token
  ) {
    throw new HttpsError(
      "invalid-argument",
      "招待情報が正しくありません。"
    );
  }

  const householdRef = db.collection("households").doc(householdId);

  const inviteRef = householdRef
    .collection("invites")
    .doc(token);

  const memberRef = householdRef
    .collection("members")
    .doc(userId);

  const userRef = db.collection("users").doc(userId);

  // トランザクションで参加処理
  return await db.runTransaction(async (transaction) => {
    const inviteSnapshot = await transaction.get(inviteRef);
    const memberSnapshot = await transaction.get(memberRef);
    const userSnapshot = await transaction.get(userRef);

    // すでに同じ家のメンバーなら成功扱い
    if (memberSnapshot.exists) {
      return {
        success: true,
        householdId,
        alreadyJoined: true
      };
    }

    // 招待情報の存在確認
    if (!inviteSnapshot.exists) {
      throw new HttpsError(
        "not-found",
        "招待情報が見つかりません。"
      );
    }

    const invite = inviteSnapshot.data();

    // 有効期限の確認
    if (invite.expiresAt.toMillis() <= Date.now()) {
      throw new HttpsError(
        "deadline-exceeded",
        "招待URLの有効期限が切れています。"
      );
    }

    // 使用回数の確認
    if (invite.usedCount >= invite.maxUses) {
      throw new HttpsError(
        "failed-precondition",
        "この招待URLはすでに使用されています。"
      );
    }

    // すでに別の家に所属していないか確認
    if (
      userSnapshot.exists &&
      userSnapshot.data().householdId
    ) {
      throw new HttpsError(
        "failed-precondition",
        "すでに別の家に所属しています。"
      );
    }

    // 招待使用回数を更新
    transaction.update(inviteRef, {
      usedCount: invite.usedCount + 1
    });

    // 家のメンバーとして登録
    transaction.set(memberRef, {
      role: "member",
      joinedAt: Timestamp.now()
    });

    // ユーザー情報に家のIDを保存
    transaction.set(
      userRef,
      { householdId },
      { merge: true }
    );

    return {
      success: true,
      householdId,
      alreadyJoined: false
    };
  });
});