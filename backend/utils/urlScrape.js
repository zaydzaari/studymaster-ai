import axios from "axios";
import * as cheerio from "cheerio";

export async function scrapeURL(url) {
  const response = await axios.get(url, {
    timeout: 10000,
    headers: { "User-Agent": "Mozilla/5.0 StudyMasterAI/1.0" },
  });

  const $ = cheerio.load(response.data);

  // Remove noise
  $("script, style, nav, footer, header, aside, .ad, .advertisement, .sidebar").remove();

  const title = $("title").text().trim();
  const body = $("article, main, .content, .post-content, body")
    .first()
    .text()
    .replace(/\s+/g, " ")
    .trim();

  return `${title}\n\n${body}`.slice(0, 50000);
}
