package ai.veltrix.app

import android.app.Activity
import android.os.Bundle
import android.graphics.Color
import android.view.Gravity
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView

class MainActivity : Activity() {
    private lateinit var conversation: LinearLayout
    private lateinit var input: EditText

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.statusBarColor = Color.rgb(12, 18, 32)
        window.navigationBarColor = Color.rgb(12, 18, 32)

        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(20, 24, 20, 16)
            setBackgroundColor(Color.rgb(12, 18, 32))
        }
        val title = TextView(this).apply {
            text = "VELTRIX AI"
            textSize = 26f
            setTextColor(Color.rgb(100, 190, 255))
            gravity = Gravity.CENTER
        }
        val subtitle = TextView(this).apply {
            text = "دستیار مستقل • نسخه آزمایشی"
            textSize = 13f
            setTextColor(Color.LTGRAY)
            gravity = Gravity.CENTER
        }
        root.addView(title)
        root.addView(subtitle)

        val scroll = ScrollView(this)
        conversation = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(4, 18, 4, 12)
        }
        scroll.addView(conversation)
        root.addView(scroll, LinearLayout.LayoutParams(-1, 0, 1f))

        val composer = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        input = EditText(this).apply {
            hint = "پیامت را بنویس..."
            textSize = 15f
            setTextColor(Color.WHITE)
            setHintTextColor(Color.GRAY)
            setSingleLine(true)
        }
        composer.addView(input, LinearLayout.LayoutParams(0, -2, 1f))
        val send = Button(this).apply {
            text = "ارسال"
            setOnClickListener { sendMessage() }
        }
        composer.addView(send)
        root.addView(composer)
        setContentView(root)

        addMessage("VELTRIX", "سلام! رابط اولیه آماده است. موتور مدل زبانی هنوز متصل نشده؛ در این نسخه پاسخ هوشمند واقعی فعال نیست.")
    }

    private fun sendMessage() {
        val message = input.text.toString().trim()
        if (message.isEmpty()) return
        addMessage("شما", message)
        input.setText("")
        addMessage("VELTRIX", "پیامت ثبت شد. اتصال مدل زبانی محلی در مرحله بعد انجام می‌شود؛ فعلاً این نسخه موتور پاسخ‌گوی هوشمند ندارد.")
    }

    private fun addMessage(sender: String, message: String) {
        val view = TextView(this).apply {
            text = "$sender\n$message"
            textSize = 15f
            setTextColor(Color.WHITE)
            setPadding(14, 12, 14, 12)
            setBackgroundColor(Color.rgb(29, 42, 62))
        }
        val params = LinearLayout.LayoutParams(-1, -2)
        params.setMargins(0, 6, 0, 6)
        conversation.addView(view, params)
    }
}
