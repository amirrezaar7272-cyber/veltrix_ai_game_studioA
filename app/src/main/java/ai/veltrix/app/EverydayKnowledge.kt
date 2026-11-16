package ai.veltrix.app

import org.json.JSONArray

/** Loads 10,000 offline Persian question/answer examples from app assets. */
object EverydayKnowledge {
    @Volatile private var answers: Map<String, String>? = null
    private fun normalize(input: String): String = input.lowercase()
        .replace('ي', 'ی').replace('ك', 'ک')
        .replace(Regex("[\\u064B-\\u065F\\u0670]"), "")
        .replace(Regex("[؟?!،,.؛:ـ\\u200c]"), " ")
        .replace(Regex("\\s+"), " ").trim()
    private fun load(context: android.content.Context): Map<String, String> {
        answers?.let { return it }
        synchronized(this) {
            answers?.let { return it }
            val text = context.assets.open("everyday-qa.json").bufferedReader().use { it.readText() }
            val array = JSONArray(text)
            val map = HashMap<String, String>(array.length())
            for (i in 0 until array.length()) {
                val row = array.getJSONObject(i)
                map[normalize(row.getString("q"))] = row.getString("a")
            }
            answers = map
            return map
        }
    }
    fun reply(context: android.content.Context, question: String): String? =
        load(context.applicationContext)[normalize(question)]
}
