package ai.veltrix.app

import android.content.Context
import org.json.JSONObject
import kotlin.math.exp
import kotlin.random.Random

/**
 * Offline inference for VELTRIX's own character-level MLP.
 * The model is produced by brain/train.py and placed in app/src/main/assets.
 */
class BrainModel(context: Context) {
    private var model: JSONObject? = null
    init {
        try {
            val raw = context.assets.open("veltrix_model.json").bufferedReader(Charsets.UTF_8).use { it.readText() }
            model = JSONObject(raw).takeIf { it.optString("format") == "veltrix-char-mlp-v1" }
        } catch (_: Exception) { model = null }
    }

    fun isReady(): Boolean = model != null

    fun generate(prompt: String, maxChars: Int = 120): String? {
        val m = model ?: return null
        val vocabJson = m.getJSONArray("vocab")
        val chars = (0 until vocabJson.length()).map { vocabJson.getString(it) }
        val ids = chars.withIndex().associate { it.value to it.index }
        if (chars.isEmpty()) return null
        val context = m.getInt("context")
        val embed = m.getInt("embedding")
        val hidden = m.getInt("hidden")
        val e = matrix(m.getJSONArray("E"))
        val w1 = matrix(m.getJSONArray("W1"))
        val b1 = vector(m.getJSONArray("b1"))
        val w2 = matrix(m.getJSONArray("W2"))
        val b2 = vector(m.getJSONArray("b2"))
        val sequence = ((" ".repeat(context) + prompt).map { ids[it.toString()] ?: 0 }).toMutableList()
        val output = StringBuilder()
        repeat(maxChars) {
            val window = sequence.takeLast(context)
            val input = DoubleArray(context * embed)
            for (i in 0 until context) {
                val row = e[window[i]]
                for (j in 0 until embed) input[i * embed + j] = row[j]
            }
            val h = DoubleArray(hidden) { j ->
                var sum = b1[j]
                for (k in input.indices) sum += input[k] * w1[k][j]
                kotlin.math.tanh(sum)
            }
            val logits = DoubleArray(chars.size) { j ->
                var sum = b2[j]
                for (k in h.indices) sum += h[k] * w2[k][j]
                sum
            }
            val max = logits.maxOrNull() ?: 0.0
            val probs = logits.map { exp((it - max).coerceIn(-40.0, 0.0)) }
            val total = probs.sum()
            var pick = Random.nextDouble() * total
            var next = 0
            for (i in probs.indices) { pick -= probs[i]; if (pick <= 0) { next = i; break } }
            sequence.add(next)
            val ch = chars[next]
            output.append(ch)
            if (ch == "\n" && output.length > 30) return output.toString().trim()
        }
        return output.toString().trim().ifBlank { null }
    }

    private fun vector(a: org.json.JSONArray) = DoubleArray(a.length()) { a.getDouble(it) }
    private fun matrix(a: org.json.JSONArray): Array<DoubleArray> =
        Array(a.length()) { i -> vector(a.getJSONArray(i)) }
}
