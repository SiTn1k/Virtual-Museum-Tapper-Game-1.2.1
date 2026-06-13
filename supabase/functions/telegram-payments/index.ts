import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

interface BoosterDef {
  title: string;
  description: string;
  price: number; // Stars
  effect: string;
  duration_minutes?: number;
}

const BOOSTERS: Record<string, BoosterDef> = {
  xp_boost_1h: {
    title: "XP Бустер x2",
    description: "Подвійний XP на 1 годину",
    price: 50,
    effect: "xp_x2",
    duration_minutes: 60,
  },
  currency_boost_1h: {
    title: "Валютний Бустер x2",
    description: "Подвійна валюта на 1 годину",
    price: 50,
    effect: "currency_x2",
    duration_minutes: 60,
  },
  super_boost_30m: {
    title: "Супер Бустер x3",
    description: "Потрійний XP та валюта на 30 хвилин",
    price: 100,
    effect: "super_x3",
    duration_minutes: 30,
  },
  legendary_gacha: {
    title: "Гарантований Легендарний",
    description: "Наступний roll дасть легендарний артефакт",
    price: 200,
    effect: "legendary_next",
  },
  support_dev: {
    title: "Підтримка розробників",
    description: "Дякуємо за підтримку! +5000 XP",
    price: 500,
    effect: "xp_grant_5000",
  },
};

async function tgCall(method: string, body: Record<string, unknown>) {
  const res = await fetch(`${TG_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const html = (content: string) =>
    new Response(content, {
      headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" },
    });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const url = new URL(req.url);

  // ─── GET requests — browser-friendly actions ─────────────────────────────
  if (req.method === "GET") {
    const action = url.searchParams.get("action");

    // GET ?action=set_webhook — register Telegram webhook, callable from browser
    if (action === "set_webhook") {
      if (!BOT_TOKEN) {
        return html(`<h2>❌ TELEGRAM_BOT_TOKEN не налаштований</h2>
          <p>Додайте секрет <b>TELEGRAM_BOT_TOKEN</b> у Supabase Dashboard → Edge Functions → Secrets</p>`);
      }
      const webhookUrl = `${SUPABASE_URL}/functions/v1/telegram-payments`;
      const result = await tgCall("setWebhook", { url: webhookUrl });
      if (result.ok) {
        return html(`<h2>✅ Webhook встановлено!</h2>
          <pre>${JSON.stringify(result, null, 2)}</pre>
          <p>URL: <code>${webhookUrl}</code></p>`);
      }
      return html(`<h2>❌ Помилка</h2><pre>${JSON.stringify(result, null, 2)}</pre>`);
    }

    // GET (no params) — status page
    const tokenOk = BOT_TOKEN.length > 10;
    const webhookUrl = `${SUPABASE_URL}/functions/v1/telegram-payments`;
    const statusPage = `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <title>Ukraine Tap — Payments Status</title>
  <style>
    body { font-family: system-ui; max-width: 600px; margin: 40px auto; padding: 0 20px; background: #111; color: #eee; }
    h1 { color: #fbbf24; }
    .ok { color: #34d399; } .err { color: #f87171; }
    pre { background: #222; padding: 16px; border-radius: 8px; font-size: 13px; overflow-x: auto; }
    a { color: #60a5fa; }
    .btn { display: inline-block; margin-top: 16px; padding: 10px 20px; background: #fbbf24; color: #000; border-radius: 8px; text-decoration: none; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Ukraine Tap — Telegram Payments</h1>
  <p>Bot Token: <b class="${tokenOk ? 'ok' : 'err'}">${tokenOk ? '✅ Налаштований' : '❌ Не налаштований'}</b></p>
  <p>Webhook URL: <code>${webhookUrl}</code></p>
  ${tokenOk
    ? `<a class="btn" href="?action=set_webhook">Встановити Webhook</a>`
    : `<p class="err">Додайте <b>TELEGRAM_BOT_TOKEN</b> у Supabase → Edge Functions → Secrets</p>`
  }
  <h2>Доступні дії (POST)</h2>
  <pre>{ "action": "create_invoice", "booster_id": "xp_boost_1h", "telegram_id": 123456 }
{ "action": "get_boosters", "telegram_id": 123456 }
{ "action": "set_webhook" }</pre>
</body>
</html>`;
    return html(statusPage);
  }

  try {
    const body = await req.json();

    // ─── Telegram Webhook handler ─────────────────────────────────────────────
    // Telegram sends updates here after setWebhook is configured.

    // Step 1: Pre-checkout — bot MUST answer within 10 seconds
    if (body.pre_checkout_query) {
      const query = body.pre_checkout_query;
      const payload: string = query.invoice_payload ?? "";
      const parts = payload.split(":");
      const boosterId = parts[0];
      const booster = BOOSTERS[boosterId];

      if (!booster) {
        await tgCall("answerPreCheckoutQuery", {
          pre_checkout_query_id: query.id,
          ok: false,
          error_message: "Невідомий товар",
        });
        return new Response("ok", { headers: corsHeaders });
      }

      await tgCall("answerPreCheckoutQuery", {
        pre_checkout_query_id: query.id,
        ok: true,
      });
      return new Response("ok", { headers: corsHeaders });
    }

    // Step 2: Successful payment — deliver goods
    if (body.message?.successful_payment) {
      const msg = body.message;
      const payment = msg.successful_payment;
      const telegramId: number = msg.from.id;
      const payload: string = payment.invoice_payload ?? "";
      const chargeId: string = payment.telegram_payment_charge_id ?? "";
      const [boosterId] = payload.split(":");
      const booster = BOOSTERS[boosterId];

      if (booster) {
        await applyBooster(supabase, telegramId, boosterId, booster, chargeId);
      }
      return new Response("ok", { headers: corsHeaders });
    }

    // ─── Mini App API ─────────────────────────────────────────────────────────
    const { action, booster_id, telegram_id } = body as {
      action: string;
      booster_id?: string;
      telegram_id?: number;
    };

    // Create invoice link (Stars payment)
    if (action === "create_invoice") {
      if (!BOT_TOKEN) {
        return json({ error: "Bot token not configured. Add TELEGRAM_BOT_TOKEN secret." }, 500);
      }
      if (!booster_id || !telegram_id) {
        return json({ error: "Missing booster_id or telegram_id" }, 400);
      }

      const booster = BOOSTERS[booster_id];
      if (!booster) {
        return json({ error: "Unknown booster" }, 400);
      }

      const result = await tgCall("createInvoiceLink", {
        title: booster.title,
        description: booster.description,
        payload: `${booster_id}:${telegram_id}`,
        provider_token: "", // empty string = Telegram Stars (XTR)
        currency: "XTR",
        prices: [{ label: booster.title, amount: booster.price }],
      });

      if (!result.ok) {
        console.error("createInvoiceLink failed:", result);
        return json({ error: result.description ?? "Failed to create invoice" }, 500);
      }

      return json({ invoice_url: result.result });
    }

    // Fetch active boosters for a user
    if (action === "get_boosters") {
      if (!telegram_id) return json({ error: "Missing telegram_id" }, 400);

      const { data } = await supabase
        .from("game_progress")
        .select("active_boosters")
        .eq("telegram_id", telegram_id)
        .maybeSingle();

      return json({ active_boosters: (data?.active_boosters as Record<string, unknown>) ?? {} });
    }

    // Configure webhook (one-time setup call)
    if (action === "set_webhook") {
      const webhookUrl = `${SUPABASE_URL}/functions/v1/telegram-payments`;
      const result = await tgCall("setWebhook", { url: webhookUrl });
      return json(result);
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err) {
    console.error("telegram-payments error:", err);
    return json({ error: String(err) }, 500);
  }
});

async function applyBooster(
  supabase: ReturnType<typeof createClient>,
  telegramId: number,
  boosterId: string,
  booster: BoosterDef,
  chargeId: string,
) {
  const { data: row } = await supabase
    .from("game_progress")
    .select("active_boosters, xp, total_xp")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (!row) {
    console.error("User not found for telegram_id:", telegramId);
    return;
  }

  const boosters = (row.active_boosters as Record<string, unknown>) ?? {};
  const now = Date.now();
  const updates: Record<string, unknown> = {};

  if (booster.duration_minutes) {
    const expiry = now + booster.duration_minutes * 60 * 1000;
    if (booster.effect === "xp_x2") {
      boosters.xp_boost_end = expiry;
      boosters.xp_boost_mult = 2;
    } else if (booster.effect === "currency_x2") {
      boosters.currency_boost_end = expiry;
      boosters.currency_boost_mult = 2;
    } else if (booster.effect === "super_x3") {
      boosters.super_boost_end = expiry;
      boosters.super_boost_mult = 3;
    }
  }

  if (booster.effect === "legendary_next") {
    boosters.legendary_next_gacha = true;
  }

  if (booster.effect === "xp_grant_5000") {
    updates.xp = ((row.xp as number) ?? 0) + 5000;
    updates.total_xp = ((row.total_xp as number) ?? 0) + 5000;
  }

  // Log the charge ID for refund support
  if (!boosters.purchase_log) boosters.purchase_log = [];
  (boosters.purchase_log as unknown[]).push({
    id: boosterId,
    charge_id: chargeId,
    purchased_at: new Date().toISOString(),
  });

  updates.active_boosters = boosters;

  await supabase
    .from("game_progress")
    .update(updates)
    .eq("telegram_id", telegramId);
}
