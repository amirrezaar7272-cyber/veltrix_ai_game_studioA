package ai.veltrix.app

import android.app.Activity
import android.os.Bundle
import android.graphics.Color
import android.view.Gravity
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.text.InputType
import java.util.concurrent.Executors

class MainActivity : Activity() {
    private val bg = Color.rgb(12, 18, 32)
    private val panel = Color.rgb(29, 42, 62)
    private val accent = Color.rgb(100, 190, 255)
    private lateinit var auth: AuthStore
    private lateinit var brain: BrainModel
    private lateinit var root: LinearLayout
    private val io = Executors.newSingleThreadExecutor()
    private var webSearchMode = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        auth = AuthStore(this)
        brain = BrainModel(this)
        window.statusBarColor = bg
        window.navigationBarColor = bg
        root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(22, 28, 22, 20)
            setBackgroundColor(bg)
        }
        setContentView(root)
        if (auth.currentName() != null) showChat(auth.currentName()!!) else showAuth()
    }

    private fun title(text: String, size: Float = 25f): TextView =
        TextView(this).apply {
            this.text = text
            textSize = size
            setTextColor(accent)
            gravity = Gravity.CENTER
            setPadding(0, 8, 0, 8)
        }

    private fun field(hintText: String, type: Int = InputType.TYPE_CLASS_TEXT): EditText =
        EditText(this).apply {
            hint = hintText
            inputType = type
            textSize = 16f
            setTextColor(Color.WHITE)
            setHintTextColor(Color.LTGRAY)
            setSingleLine(true)
            setPadding(14, 8, 14, 8)
            setBackgroundColor(panel)
        }

    private fun action(text: String, onTap: () -> Unit) =
        Button(this).apply {
            this.text = text
            setOnClickListener { onTap() }
        }

    private fun reset() {
        root.removeAllViews()
    }

    private fun showAuth() {
        reset()
        root.addView(title("VELTRIX AI"))
        root.addView(title("حساب کاربری", 18f))
        val name = field("نام نمایشی")
        val email = field("ایمیل", InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_EMAIL_ADDRESS)
        val password = field("رمز عبور (حداقل ۸ نویسه)", InputType.TYPE_CLASS_TEXT or InputType.TYPE_TEXT_VARIATION_PASSWORD)
        val status = TextView(this).apply {
            setTextColor(Color.rgb(255, 145, 145))
            textSize = 14f
            gravity = Gravity.CENTER
        }
        root.addView(name, matchWrap())
        root.addView(email, matchWrap())
        root.addView(password, matchWrap())
        root.addView(action("ساخت حساب جدید") {
            val error = auth.register(name.text.toString(), email.text.toString(), password.text.toString().toCharArray())
            if (error == null) showChat(auth.currentName() ?: name.text.toString()) else status.text = error
        })
        root.addView(action("ورود به حساب") {
            val error = auth.login(email.text.toString(), password.text.toString().toCharArray())
            if (error == null) showChat(auth.currentName() ?: "کاربر") else status.text = error
        })
        root.addView(status)
        root.addView(TextView(this).apply {
            text = "حساب‌ها فعلاً فقط روی همین دستگاه ذخیره می‌شوند؛ سرور یا همگام‌سازی ابری نداریم."
            setTextColor(Color.LTGRAY)
            textSize = 12f
            gravity = Gravity.CENTER
            setPadding(0, 18, 0, 0)
        })
    }

    private fun matchWrap() = LinearLayout.LayoutParams(-1, -2).apply {
        setMargins(0, 8, 0, 8)
    }

    private fun showChat(name: String) {
        reset()
        root.addView(title("VELTRIX AI"))
        root.addView(TextView(this).apply {
            text = "خوش آمدی، $name"
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
        })
        root.addView(action("خروج از حساب") {
            auth.logout()
            showAuth()
        })
        val scroll = ScrollView(this)
        val messages = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(4, 18, 4, 12)
        }
        scroll.addView(messages)
        root.addView(scroll, LinearLayout.LayoutParams(-1, 0, 1f))
        addMessage(messages, "VELTRIX", if (brain.isReady()) "مغز عصبی آفلاین بارگذاری شد." else "هسته VELTRIX آماده اتصال است؛ هنوز مدل آموزش‌دیده‌ای در فایل‌های برنامه وجود ندارد.")
        root.addView(action("جستجوی اینترنت: روشن / خاموش") { webSearchMode = !webSearchMode; addMessage(messages, "VELTRIX", if (webSearchMode) "جستجو روشن شد" else "جستجو خاموش شد") })
        val composer = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        val input = field("پیامت را بنویس...")
        composer.addView(input, LinearLayout.LayoutParams(0, -2, 1f))
        composer.addView(action("ارسال") {
            val msg = input.text.toString().trim()
            if (msg.isNotEmpty()) {
                addMessage(messages, "شما", msg)
                input.setText("")
                if (webSearchMode) {
                    addMessage(messages, "VELTRIX", "در حال جستجو…")
                    io.execute { val result = WebSearchService.searchAndSummarize(msg); runOnUiThread { addMessage(messages, "VELTRIX", result) } }
                } else {
                    val answer = brain.generate(msg) ?: EverydayKnowledge.reply(this, msg) ?: ChatResponder.reply(msg)
                    addMessage(messages, "VELTRIX", answer)
                }
            }
        })
        root.addView(composer)
    }

    private fun addMessage(container: LinearLayout, sender: String, message: String) {
        container.addView(TextView(this).apply {
            text = "$sender\n$message"
            textSize = 15f
            setTextColor(Color.WHITE)
            setPadding(14, 12, 14, 12)
            setBackgroundColor(panel)
        }, matchWrap())
    }
}
