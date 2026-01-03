<template>
  <div class="page">
    <header class="hero">
      <div>
        <p class="eyebrow">Future Letters</p>
        <h1>寫一封給未來的信</h1>
        <p class="lede">
          安排你的信件，寄給未來的自己或朋友。填寫表單後，信件會先儲存到 Cloudflare D1，等到預定時間再透過
          Resend 發送。
        </p>
      </div>
      <div class="badge">Beta</div>
    </header>

    <section class="card">
      <h2>信件內容</h2>
      <form class="form" @submit.prevent="handleSubmit">
        <div class="field">
          <label for="recipientEmail">收件人 Email</label>
          <input
            id="recipientEmail"
            v-model="recipientEmail"
            type="email"
            required
            placeholder="friend@example.com"
          />
        </div>

        <div class="field">
          <label for="subject">主旨</label>
          <input id="subject" v-model="subject" type="text" required placeholder="給未來的你" />
        </div>

        <div class="field">
          <label for="deliveryDate">寄送時間</label>
          <input id="deliveryDate" v-model="deliveryDate" type="datetime-local" required />
          <small>系統會將時間轉為 UTC Unix Timestamp 儲存。</small>
        </div>

        <div class="field">
          <label for="content">內容</label>
          <textarea
            id="content"
            v-model="content"
            rows="6"
            required
            placeholder="寫下你想對未來說的話…"
          />
        </div>

        <div class="field checkbox">
          <label>
            <input v-model="isPublic" type="checkbox" />
            允許日後公開展示（可選）
          </label>
        </div>

        <div class="actions">
          <button type="submit" :disabled="isSubmitting">
            {{ isSubmitting ? '送出中…' : '排程信件' }}
          </button>
          <p v-if="message" class="message success">{{ message }}</p>
          <p v-if="error" class="message error">{{ error }}</p>
        </div>
      </form>
    </section>

    <section class="card secondary">
      <h2>寄送流程說明</h2>
      <ol>
        <li>表單送出後，信件會被寫入 D1，狀態為 <code>pending</code>。</li>
        <li>在 Cloudflare Pages 綁定 Resend API Key 與寄件人地址後，呼叫 <code>POST /api/letters/send</code> 會批次發送到期的信件。</li>
        <li>若寄送失敗，狀態會標記為 <code>failed</code>，之後可再觸發重送。</li>
      </ol>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const recipientEmail = ref('')
const subject = ref('')
const content = ref('')
const deliveryDate = ref('')
const isPublic = ref(false)

const isSubmitting = ref(false)
const message = ref('')
const error = ref('')

const handleSubmit = async () => {
  message.value = ''
  error.value = ''

  const parsedDeliveryDate = Date.parse(deliveryDate.value)
  if (Number.isNaN(parsedDeliveryDate)) {
    error.value = '請輸入有效的日期時間'
    return
  }

  const deliveryTimestamp = Math.floor(parsedDeliveryDate / 1000)

  isSubmitting.value = true
  try {
    await $fetch('/api/letters', {
      method: 'POST',
      body: {
        recipient_email: recipientEmail.value,
        subject: subject.value,
        content: content.value,
        delivery_date: deliveryTimestamp,
        is_public: isPublic.value,
      },
    })

    message.value = '信件已排程！到期後會透過 Resend 發送。'
    recipientEmail.value = ''
    subject.value = ''
    content.value = ''
    deliveryDate.value = ''
    isPublic.value = false
  } catch (err: any) {
    error.value = err?.data?.message || err?.data?.statusMessage || '發生錯誤，請稍後再試'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
:global(body) {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #0b1221;
  color: #e5ecff;
}

.page {
  max-width: 960px;
  margin: 0 auto;
  padding: 40px 20px 64px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-weight: 700;
  color: #7fb0ff;
  margin: 0 0 8px;
}

h1 {
  font-size: 32px;
  margin: 0 0 8px;
}

.lede {
  margin: 0;
  color: #cbd5f7;
  line-height: 1.5;
}

.badge {
  background: #16213a;
  border: 1px solid #22305c;
  color: #9ac3ff;
  padding: 8px 12px;
  border-radius: 10px;
  font-weight: 700;
}

.card {
  background: #111a2f;
  border: 1px solid #1f2f55;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
}

.card.secondary {
  background: #0f172a;
}

h2 {
  margin: 0 0 12px;
  font-size: 20px;
}

.form {
  display: grid;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.checkbox {
  flex-direction: row;
  align-items: center;
}

label {
  font-weight: 600;
  color: #dce6ff;
}

input,
textarea {
  background: #0c1426;
  border: 1px solid #213156;
  border-radius: 10px;
  padding: 12px;
  color: #e5ecff;
  font-size: 14px;
}

input:focus,
textarea:focus {
  outline: 2px solid #5aa2ff;
  outline-offset: 0;
}

small {
  color: #8fa2cd;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

button {
  background: linear-gradient(120deg, #3b82f6, #60a5fa);
  border: none;
  color: #0c1220;
  border-radius: 12px;
  padding: 12px 16px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

button:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 25px rgba(58, 133, 246, 0.35);
}

.message {
  margin: 0;
  font-weight: 600;
}

.success {
  color: #7bf1c3;
}

.error {
  color: #f6a7b5;
}

ol {
  margin: 0;
  padding-left: 20px;
  color: #cbd5f7;
  line-height: 1.6;
}

code {
  background: #0c1426;
  border-radius: 6px;
  padding: 2px 6px;
  border: 1px solid #1f2f55;
}

@media (max-width: 720px) {
  .hero {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
