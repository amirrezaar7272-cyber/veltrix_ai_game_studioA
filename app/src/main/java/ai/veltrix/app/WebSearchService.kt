package ai.veltrix.app

import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

object WebSearchService {
  fun searchAndSummarize(query: String): String {
    if (query.isBlank()) return "عبارت جستجو خالی است."
    return try {
      val q = URLEncoder.encode(query, "UTF-8")
      val url = URL("https://api.duckduckgo.com/?q=" + q + "&format=json&no_html=1&skip_disambig=1")
      val c = url.openConnection() as HttpURLConnection
      c.connectTimeout = 12000; c.readTimeout = 15000
      c.setRequestProperty("User-Agent", "VELTRIX-AI Android")
      val json = c.inputStream.bufferedReader(Charsets.UTF_8).use { it.readText() }
      c.disconnect()
      val data = JSONObject(json)
      val lines = mutableListOf<String>()
      val abstractText = data.optString("AbstractText")
      if (abstractText.isNotBlank()) lines.add(abstractText)
      val related = data.optJSONArray("RelatedTopics")
      if (related != null) for (i in 0 until minOf(related.length(), 8)) {
        val item = related.optJSONObject(i) ?: continue
        val text = item.optString("Text")
        val link = item.optString("FirstURL")
        if (text.isNotBlank()) lines.add(text + if (link.isNotBlank()) "\n" + link else "")
      }
      if (lines.isEmpty()) "پاسخ فوری برای این عبارت پیدا نشد. این سرویس خلاصه‌های فوری DuckDuckGo را جستجو می‌کند و پوشش کامل وب ندارد."
      else "خلاصه جستجو برای: " + query + "\n\n" + lines.take(5).joinToString("\n\n• ") + "\n\nمنبع: DuckDuckGo Instant Answers. این خلاصه از داده‌های فوری سرویس ساخته شده است، نه از مطالعه کامل صفحات."
    } catch (e: Exception) { "جستجوی اینترنت انجام نشد: " + (e.localizedMessage ?: "خطای اتصال") }
  }
}