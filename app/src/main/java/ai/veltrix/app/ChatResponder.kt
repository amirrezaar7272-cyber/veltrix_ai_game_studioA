package ai.veltrix.app

/**
 * Offline intent-based fallback. This is a deterministic starter assistant,
 * not a trained large language model.
 */
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

        if (hasAny(q, "سلام", "درود", "صبح بخیر", "عصر بخیر", "شب بخیر", "hello", "hi ", "hey")) {
            return "سلام! 😊 خوش اومدی. من خوبم و آماده‌ام کمکت کنم. تو چطوری؟"
        }
        if (hasAny(q, "خوبی", "خوب هستی", "چطوری", "حالت چطوره", "چه خبر", "how are you")) {
            return "ممنون که پرسیدی! 😊 من خوبم و آماده‌ام باهات گپ بزنم. تو خوبی؟"
        }
        if (hasAny(q, "اسمت چیه", "اسم تو", "نامت چیه", "کی هستی", "who are you", "your name")) {
            return "من VELTRIX AI هستم؛ یک دستیار گفت‌وگویی فارسی و انگلیسی که در حال توسعه است."
        }
        if (hasAny(q, "چند سالته", "سن تو", "عمر تو")) return "من انسان نیستم و سن واقعی ندارم؛ VELTRIX AI یک پروژهٔ نرم‌افزاریه."
        if (hasAny(q, "کجا زندگی", "اهل کجایی")) return "من مکان زندگی ندارم؛ یک نرم‌افزارم که روی دستگاه یا وب اجرا می‌شم."
        if (hasAny(q, "ممنون", "مرسی", "دمت گرم", "سپاس", "متشکرم", "thank you", "thanks")) return "خواهش می‌کنم! 🌟 خوشحالم که تونستم کمک کنم."
        if (hasAny(q, "ببخشید", "معذرت", "شرمنده")) return "اشکالی نداره 😊 بگو ببینم چطور می‌تونم کمک کنم."
        if (hasAny(q, "خداحافظ", "بای", "فعلا", "فعلاً", "شب بخیر", "goodbye", "bye")) return "فعلاً! 👋 هر وقت خواستی برگرد تا دوباره گپ بزنیم."
        if (hasAny(q, "دوستت دارم", "عاشقتم")) return "چه مهربون! 💙 من احساس انسانی ندارم، ولی با کمال میل همراه و کمکت می‌کنم."
        if (hasAny(q, "شوخی", "جوک", "بخندون")) return "یه برنامه‌نویس به دوستش گفت: کدم بدون باگ اجرا شد! دوستش گفت: پس احتمالاً هنوز اجراش نکردی! 😄"
        if (hasAny(q, "قابلیت", "چه کار", "چه کاری", "کمک میکنی", "کمک می کنی")) {
            return "می‌تونم گفت‌وگوی روزمره داشته باشم، چند سایت معرفی کنم، نمونه‌کدهای آموزشی بسازم و دربارهٔ خطاهای رایج راهنمایی بدم. برای پاسخ‌گویی هوشمند به هر موضوع و تولید پروژهٔ پیچیده، هنوز به مدل زبانی واقعی و ابزار اجرای کد نیاز داریم."
        }

        if (hasAny(q, "سایت", "وبسایت", "وب سایت", "website") && hasAny(q, "برنامه نویسی", "برنامه‌نویسی", "کدنویسی", "coding", "code")) {
            return "برای یادگیری برنامه‌نویسی این سایت‌ها مفیدن:\n\n1) freeCodeCamp — آموزش و تمرین رایگان: https://www.freecodecamp.org/\n2) MDN — مرجع HTML، CSS و JavaScript: https://developer.mozilla.org/\n3) W3Schools — آموزش قدم‌به‌قدم: https://www.w3schools.com/\n4) GitHub — نگهداری و اشتراک کد: https://github.com/\n\nاگر بگی با گوشی کار می‌کنی یا کامپیوتر و چه زبانی می‌خوای، دقیق‌تر پیشنهاد می‌دم."
        }
        if (hasAny(q, "سایت", "وبسایت", "وب سایت", "website")) {
            return "حتماً! چند سایت مفید:\n\n• آموزش رایگان: https://www.khanacademy.org/\n• جستجوی دانشنامه‌ای: https://www.wikipedia.org/\n• یادگیری برنامه‌نویسی: https://www.freecodecamp.org/\n• ابزارهای آنلاین: https://www.photopea.com/\n\nدنبال سایت در چه زمینه‌ای هستی؟"
        }

        if (hasAny(q, "کد", "کدنویسی", "برنامه نویسی", "برنامه‌نویسی", "code", "coding", "پایتون", "python", "html", "javascript", "جاوا")) {
            if (hasAny(q, "خطا", "ارور", "باگ", "error", "debug", "کار نمیکنه", "کار نمی کنه")) {
                return "حتماً بررسی می‌کنم. کل کد، متن دقیق خطا و بگو انتظار داشتی چه اتفاقی بیفته. بدون دیدن کد و خطا نمی‌تونم علت رو با اطمینان تشخیص بدم."
            }
            if (hasAny(q, "سایت", "صفحه وب", "وبسایت", "وب سایت")) return websiteStarter()
            if (hasAny(q, "ماشین حساب", "calculator")) return pythonCalculator()
            if (hasAny(q, "پایتون", "python")) return pythonStarter()
            if (hasAny(q, "html", "صفحه وب")) return websiteStarter()
            return "می‌تونم نمونه‌کد آموزشی و راهنمایی برنامه‌نویسی ارائه کنم؛ اما هنوز موتور کدنویسی پیشرفته‌ای ندارم که پروژهٔ بزرگ را خودکار بسازد، اجرا کند و همهٔ خطاهایش را رفع کند.\n\nبرای شروع، این ۴ مورد رو بگو:\n۱) چه چیزی می‌سازی؟\n۲) زبان یا فناوری؟\n۳) دقیقاً چه قابلیت‌هایی؟\n۴) خروجی وب، اندروید یا دسکتاپ؟"
        }

        if (hasAny(q, "هوا", "آب و هوا", "weather")) return "برای وضعیت زندهٔ هوا باید به سرویس آب‌وهوا وصل بشم؛ در این نسخه دادهٔ زندهٔ هواشناسی ندارم."
        if (hasAny(q, "ساعت چنده", "ساعت الان", "time is it")) return "برای گفتن ساعت دقیق باید زمان محلی دستگاه یا سرویس زمان را بخوانم؛ این نسخه هنوز ساعت زنده ندارد."
        if (hasAny(q, "خبر", "اخبار", "news")) return "برای خبرهای تازه باید جستجوی وب انجام بشه. حالت جستجوی اینترنت برنامه رو روشن کن و موضوع خبر رو بنویس."
        if (hasAny(q, "خسته", "حالم بده", "ناراحتم")) return "متأسفم که این حس رو داری. اگر دوست داری بگو چی شده؛ گوش می‌دم و سعی می‌کنم کمکت کنم."
        if (hasAny(q, "خوبم", "من خوبم", "عالی ام", "عالی‌ام")) return "چه عالی! 😄 امروز دوست داری دربارهٔ چی صحبت کنیم؟"

        return "می‌خوام درست راهنمایی‌ات کنم، ولی این نسخه هنوز مدل زبانی عمومی و فهم عمیق متن نداره. لطفاً سؤال رو کمی دقیق‌تر بنویس یا موضوعش رو مشخص کن."
    }

    private fun websiteStarter() = """این یک قالب کامل و سادهٔ شروع سایت است. آن را در فایل index.html ذخیره و در مرورگر باز کن:

<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>وب‌سایت من</title>
  <style>
    body{font-family:Tahoma,sans-serif;background:#101827;color:#fff;margin:0;padding:40px;text-align:center}
    main{max-width:700px;margin:auto;background:#1d2a40;padding:32px;border-radius:18px}
    button{padding:12px 22px;border:0;border-radius:10px;background:#38bdf8;cursor:pointer}
  </style>
</head>
<body>
  <main>
    <h1>سلام! به سایت من خوش آمدی</h1>
    <p>این اولین صفحهٔ وب من است.</p>
    <button onclick="document.querySelector('#result').textContent='دکمه درست کار می‌کند!'">کلیک کن</button>
    <p id="result"></p>
  </main>
</body>
</html>

این قالب پایه است؛ برای ساخت پروژهٔ واقعی باید جزئیات طراحی و قابلیت‌ها را مشخص کنی."""

    private fun pythonCalculator() = """ماشین‌حساب سادهٔ پایتون:

def calculator():
    print("ماشین حساب: برای خروج q را وارد کن")
    while True:
        first = input("عدد اول: ")
        if first.lower() == "q":
            break
        operator = input("عملگر (+, -, *, /): ")
        second = input("عدد دوم: ")
        try:
            a, b = float(first), float(second)
            if operator == "+": result = a + b
            elif operator == "-": result = a - b
            elif operator == "*": result = a * b
            elif operator == "/":
                if b == 0:
                    print("تقسیم بر صفر مجاز نیست")
                    continue
                result = a / b
            else:
                print("عملگر نامعتبر است")
                continue
            print("نتیجه:", result)
        except ValueError:
            print("لطفاً عدد معتبر وارد کن")

if __name__ == "__main__":
    calculator()

کد را در calculator.py ذخیره و با دستور python calculator.py اجرا کن."""
}
