package ai.veltrix.app

import android.content.Context
import android.util.Base64
import java.security.MessageDigest
import java.security.SecureRandom
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

/**
 * Device-local account store. Passwords are never stored; only PBKDF2 hashes and salts.
 * This is intentionally offline and does not provide cross-device/cloud accounts.
 */
class AuthStore(context: Context) {
    private val prefs = context.getSharedPreferences("veltrix_accounts", Context.MODE_PRIVATE)
    private val random = SecureRandom()
    private val iterations = 160_000
    private val keyLength = 256

    fun register(name: String, email: String, password: CharArray): String? {
        val key = email.trim().lowercase()
        if (name.isBlank()) return "نام را وارد کن."
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(key).matches()) return "ایمیل معتبر نیست."
        if (password.size < 8) return "رمز عبور باید حداقل ۸ نویسه باشد."
        if (prefs.contains("account.$key.hash")) return "این ایمیل قبلاً روی این دستگاه ثبت شده است."

        val salt = ByteArray(16).also { random.nextBytes(it) }
        val hash = derive(password, salt)
        val ok = prefs.edit()
            .putString("account.$key.name", name.trim())
            .putString("account.$key.salt", Base64.encodeToString(salt, Base64.NO_WRAP))
            .putString("account.$key.hash", Base64.encodeToString(hash, Base64.NO_WRAP))
            .putString("session.email", key)
            .commit()
        password.fill('\u0000')
        return if (ok) null else "ذخیره حساب انجام نشد. دوباره تلاش کن."
    }

    fun login(email: String, password: CharArray): String? {
        val key = email.trim().lowercase()
        val saltText = prefs.getString("account.$key.salt", null)
            ?: return "حسابی با این ایمیل روی این دستگاه پیدا نشد."
        val hashText = prefs.getString("account.$key.hash", null)
            ?: return "اطلاعات حساب ناقص است."
        val salt = Base64.decode(saltText, Base64.NO_WRAP)
        val expected = Base64.decode(hashText, Base64.NO_WRAP)
        val actual = derive(password, salt)
        password.fill('\u0000')
        if (!MessageDigest.isEqual(expected, actual)) return "ایمیل یا رمز عبور اشتباه است."
        prefs.edit().putString("session.email", key).apply()
        return null
    }

    fun currentName(): String? {
        val email = prefs.getString("session.email", null) ?: return null
        return prefs.getString("account.$email.name", null)
    }

    fun logout() {
        prefs.edit().remove("session.email").apply()
    }

    private fun derive(password: CharArray, salt: ByteArray): ByteArray {
        val spec = PBEKeySpec(password, salt, iterations, keyLength)
        return try {
            SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
                .generateSecret(spec).encoded
        } finally {
            spec.clearPassword()
        }
    }
}
