// @ts-nocheck

const BOT_API = "https://api.telegram.org";

export default {
  async fetch(request, env) {
    if (request.method === "GET") {
      return new Response("🧠 Degen Researcher Online");
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const update = await request.json();

      console.log("UPDATE:", JSON.stringify(update));

      const message =
        update.message ||
        update.edited_message;

      if (!message) {
        return new Response("OK");
      }

      const chatId = message.chat?.id;
      const chatType = message.chat?.type;
      const text = message.text || "";

      console.log("CHAT ID:", chatId);
      console.log("CHAT TYPE:", chatType);
      console.log("TEXT:", text);

      // Personal DM
      if (
        String(chatId) ===
        String(env.OWNER_CHAT_ID)
      ) {
        await sendMessage(
          env.TELEGRAM_BOT_TOKEN,
          chatId,
          `🧠 Researcher received your message\n\n${text}`
        );

        return new Response("OK");
      }

      // Group messages
      if (
        chatType === "group" ||
        chatType === "supergroup"
      ) {
        const ca = detectCA(text);

        if (ca) {
          console.log("CA DETECTED:", ca);

          await sendMessage(
            env.TELEGRAM_BOT_TOKEN,
            env.OWNER_CHAT_ID,
            `🧠 CA DETECTED\n\nCA:\n${ca}\n\nWaiting for checker data...`
          );
        }
      }

      return new Response("OK");

    } catch (error) {
      console.error(
        "Webhook error:",
        error
      );

      return new Response("ERROR", {
        status: 500
      });
    }
  }
};


function detectCA(text) {
  // Solana CA
  const solana =
    text.match(/\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/);

  if (solana) {
    return solana[0];
  }

  // EVM CA
  const evm =
    text.match(/\b0x[a-fA-F0-9]{40}\b/);

  if (evm) {
    return evm[0];
  }

  return null;
}


async function sendMessage(
  token,
  chatId,
  text
) {
  const response = await fetch(
    `${BOT_API}/bot${token}/sendMessage`,
    {
      method: "POST",

      headers: {
        "content-type":
          "application/json"
      },

      body: JSON.stringify({
        chat_id: chatId,
        text: text
      })
    }
  );

  if (!response.ok) {
    console.error(
      "Telegram API error:",
      await response.text()
    );
  }
}