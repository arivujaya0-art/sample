const { initializeApp } = require("firebase-admin/app");
const { getDatabase } = require("firebase-admin/database");
const { onValueCreated } = require("firebase-functions/v2/database");

initializeApp();

// Secure server-side retention: keep the newest 30 messages in /messages.
// Admin SDK writes bypass client database rules.
exports.keepLatest30ChatMessages = onValueCreated(
  {
    ref: "/messages/{messageId}",
    region: "asia-southeast1",
    maxInstances: 1
  },
  async () => {
    const messagesRef = getDatabase().ref("messages");

    await messagesRef.transaction((current) => {
      if (!current || typeof current !== "object") return current;

      const rows = Object.entries(current).sort((a, b) => {
        const timeA = Number(a[1]?.createdAt || 0);
        const timeB = Number(b[1]?.createdAt || 0);
        return timeA - timeB;
      });

      while (rows.length > 30) {
        const [oldestId] = rows.shift();
        delete current[oldestId];
      }

      return current;
    });
  }
);
