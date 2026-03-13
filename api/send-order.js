export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    const {
      customerName,
      phone,
      email,
      address,
      deliveryDate,
      deliveryTime,
      notes,
      includeTax,
      subtotal,
      tax,
      total,
      items
    } = req.body || {};

    if (!customerName || !phone || !address || !Array.isArray(items) || items.length === 0) {
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
        error: "Missing Telegram environment variables"
      });
    }

    const itemsText = items
      .map(item => {
        const qty = Number(item.qty || 0);
        const price = Number(item.price || 0);
        const lineTotal = Number(item.lineTotal || qty * price);
        return `• ${item.name} x${qty} — $${lineTotal.toFixed(2)} CAD`;
      })
      .join("\n");

    const message =
`🧁 New Reb Bakes Order

👤 Name: ${customerName}
📱 Phone: ${phone}
📧 Email: ${email || "N/A"}
📍 Address: ${address}
📅 Date: ${deliveryDate || "N/A"}
⏰ Time: ${deliveryTime || "N/A"}

🛒 Items:
${itemsText}

💰 Subtotal: $${Number(subtotal || 0).toFixed(2)} CAD
🧾 Tax included: ${includeTax ? "Yes" : "No"}
🧮 Tax: $${Number(tax || 0).toFixed(2)} CAD
💵 Total: $${Number(total || 0).toFixed(2)} CAD

📝 Notes:
${notes || "None"}`;

    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });

    const telegramData = await telegramResponse.json();

    if (!telegramResponse.ok || !telegramData.ok) {
      return res.status(500).json({
        ok: false,
        error: "Telegram API request failed",
        details: telegramData
      });
    }

    return res.status(200).json({
      ok: true
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      ok: false,
      error: "Unexpected server error"
    });
  }
}
