export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const {
      customerName,
      email,
      phone,
      address,
      deliveryDate,
      deliveryTime,
      notes,
      items,
      total
    } = req.body || {};

    if (!customerName || !phone || !address || !items || !items.length) {
      return res.status(400).json({
        ok: false,
        error: "Missing required order fields"
      });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return res.status(500).json({
        ok: false,
        error: "Server is missing Telegram configuration"
      });
    }

    const itemsText = items
      .map((item) => {
        const qty = Number(item.qty || 0);
        const price = Number(item.price || 0);
        const lineTotal = qty * price;
        return `• ${item.name} x${qty} — $${lineTotal.toFixed(2)} CAD`;
      })
      .join("\n");

    const message =
`🧁 New Reb Bakes Order

👤 Name: ${customerName}
📧 Email: ${email || "N/A"}
📱 Phone: ${phone}
📍 Address: ${address}
📅 Date: ${deliveryDate || "N/A"}
⏰ Time: ${deliveryTime || "N/A"}

🛒 Items:
${itemsText}

💵 Total: $${Number(total || 0).toFixed(2)} CAD

📝 Notes:
${notes || "None"}`;

    const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });

    const tgData = await tgRes.json();

    if (!tgRes.ok || !tgData.ok) {
      return res.status(500).json({
        ok: false,
        error: "Telegram API request failed",
        details: tgData
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Unexpected server error",
      details: String(err)
    });
  }
}
