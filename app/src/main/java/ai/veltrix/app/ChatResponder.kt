package ai.veltrix.app

object ChatResponder {
    fun reply(message: String): String {
        val q = message.trim().lowercase()
        if (q.isBlank()) return "پیامت خالیه؛ چیزی بنویس تا با هم صحبت کنیم."
        if (q.contains("سلام") || q == "hi" || q == "hello" || q.startsWith("hey")) {
            return "سلام! 😊 ممنون، خوبم و آماده‌ام کمکت کنم. تو چطوری؟"
        }
        if (q.contains("چطوری") || q.contains("حالت چطوره") || q.contains("how are you")) {
            return "ممنون که پرسیدی! 😊 من خوبم و آمادهٔ گفت‌وگو با تو هستم. خودت چطوری؟"
        }
        if (q.contains("اسمت") || q.contains("نامت") || q.contains("who are you")) {
            return "من VELTRIX AI هستم؛ یک دستیار گفت‌وگویی فارسی و انگلیسی که در حال توسعه است."
        }
        if (q.contains("سایت") || q.contains("وبسایت") || q.contains("website") || q.contains("معرفی کن")) {
            return "حتماً! چند سایت مفید:\n\n• یادگیری برنامه‌نویسی: https://www.freecodecamp.org/\n• آموزش رایگان: https://www.khanacademy.org/\n• پرسش و پاسخ برنامه‌نویسی: https://stackoverflow.com/\n\nاگر بگی دنبال چه موضوعی هستی، پیشنهاد دقیق‌تری می‌دم."
        }
        if (q.contains("ممنون") || q.contains("مرسی") || q.contains("thanks")) return "خواهش می‌کنم! 🌟 هر وقت خواستی من اینجام."
        if (q.contains("خداحافظ") || q.contains("بای") || q.contains("bye")) return "فعلاً! 👋 امیدوارم دوباره گپ بزنیم."
        if (q.contains("قابلیت") || q.contains("چه کار") || q.contains("کمک")) {
            return "فعلاً می‌تونم گفت‌وگوی ساده داشته باشم و چند سایت مفید معرفی کنم. مغز زبانی پیشرفته هنوز در حال توسعه است."
        }
        return "متوجه منظورت شدم، اما هنوز مغز زبانی پیشرفته‌ای ندارم که به هر پرسشی پاسخ دقیق بدهد. می‌تونی ساده‌تر بپرسی یا موضوعت رو مشخص کنی تا بهتر راهنمایی‌ات کنم."
    }
}
