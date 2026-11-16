package ai.veltrix.app

/** Offline fallback. This is not a trained large language model. */
object ChatResponder {
    private fun normalize(input: String): String = input.lowercase()
        .replace('ي', 'ی').replace('ك', 'ک')
        .replace(Regex("[\\u064B-\\u065F\\u0670]"), "")
        .replace(Regex("[؟?!،,.؛:ـ\\u200c]"), " ")
        .replace(Regex("\\s+"), " ").trim()
    private fun hasAny(q: String, vararg words: String) = words.any { q.contains(it) }
    fun reply(message: String): String {
        val q = normalize(message)
        if (q.isBlank()) return "پیامت خالیه؛ چیزی بنویس تا با هم صحبت کنیم."
        if (hasAny(q, "سلام", "درود", "صبح بخیر", "عصر بخیر", "شب بخیر", "hello", "hi ", "hey")) return "سلام! 😊 خوش اومدی. من خوبم و آماده‌ام کمکت کنم. تو چطوری؟"
        if (hasAny(q, "خوبی", "خوب هستی", "چطوری", "حالت چطوره", "چه خبر", "how are you")) return "ممنون که پرسیدی! 😊 من خوبم و آماده‌ام باهات گپ بزنم. تو خوبی؟"
        if (hasAny(q, "اسمت چیه", "اسم تو", "نامت چیه", "کی هستی", "who are you", "your name")) return "من VELTRIX AI هستم؛ یک دستیار گفت‌وگویی فارسی و انگلیسی."
        if (hasAny(q, "ممنون", "مرسی", "دمت گرم", "سپاس", "متشکرم", "thank you", "thanks")) return "خواهش می‌کنم! 🌟 خوشحالم که تونستم کمک کنم."
        if (hasAny(q, "خداحافظ", "بای", "فعلا", "goodbye", "bye")) return "فعلاً! 👋 هر وقت خواستی برگرد تا دوباره گپ بزنیم."
        if (hasAny(q, "سایت", "وبسایت", "وب سایت", "website") && hasAny(q, "برنامه نویسی", "برنامه‌نویسی", "کدنویسی", "coding", "code")) return "برای برنامه‌نویسی freeCodeCamp و MDN را ببین: https://www.freecodecamp.org/ و https://developer.mozilla.org/"
        if (hasAny(q, "کد", "کدنویسی", "برنامه نویسی", "برنامه‌نویسی", "code", "coding")) return "کد و زبان موردنظرت را بفرست تا راهنمایی‌ات کنم. برای پروژه‌های پیچیده هنوز به موتور کدنویسی و اجرای واقعی نیاز داریم."
        return "این پرسش هنوز در مجموعهٔ پاسخ‌های آفلاین من نیست. لطفاً کمی دقیق‌تر بپرس."
    }
}
