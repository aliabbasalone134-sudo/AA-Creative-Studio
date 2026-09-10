export default async function handler(req) {
    try {
        const feeds = [
            {
                name: "Google News Pakistan",
                url: "https://news.google.com/rss/search?q=Pakistan&hl=en-PK&gl=PK&ceid=PK:en"
            },
            {
                name: "Google News Lahore",
                url: "https://news.google.com/rss/search?q=Lahore&hl=en-PK&gl=PK&ceid=PK:en"
            },
            {
                name: "Google News Punjab",
                url: "https://news.google.com/rss/search?q=Punjab+Pakistan&hl=en-PK&gl=PK&ceid=PK:en"
            },
            {
                name: "Google News Islamabad",
                url: "https://news.google.com/rss/search?q=Islamabad&hl=en-PK&gl=PK&ceid=PK:en"
            },
            {
                name: "Google News Karachi",
                url: "https://news.google.com/rss/search?q=Karachi&hl=en-PK&gl=PK&ceid=PK:en"
            }
        ];

        const results = [];

        for (const feed of feeds) {
            try {
                const response = await fetch(feed.url);

                if (!response.ok) continue;

                const xml = await response.text();

                const items =
                    xml.match(/<item>[\s\S]*?<\/item>/g) || [];

                for (const item of items.slice(0, 10)) {
                    const title = getTag(item, "title");
                    const link = getTag(item, "link");
                    const pubDate = getTag(item, "pubDate");
                    const description = getTag(item, "description");

                    if (!title || !link) continue;

                    results.push({
                        title: clean(title),
                        link: clean(link),
                        date: pubDate || "",
                        description: clean(
                            stripHTML(description || "")
                        ),
                        source: feed.name
                    });
                }

            } catch (error) {
                console.log(
                    "Feed error:",
                    feed.name,
                    error.message
                );
            }
        }

        const unique = [];
        const seen = new Set();

        for (const item of results) {
            const key = item.title.toLowerCase();

            if (!seen.has(key)) {
                seen.add(key);
                unique.push(item);
            }
        }

        unique.sort((a, b) => {
            return (
                new Date(b.date || 0) -
                new Date(a.date || 0)
            );
        });

        return new Response(
            JSON.stringify({
                success: true,
                updated: new Date().toISOString(),
                total: unique.length,
                news: unique.slice(0, 50)
            }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Cache-Control": "public, max-age=300"
                }
            }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({
                success: false,
                error: "Unable to load news"
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                }
            }
        );
    }
}


// ---------------------------------------------
// Helpers
// ---------------------------------------------

function getTag(xml, tag) {
    const regex = new RegExp(
        `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
        "i"
    );

    const match = xml.match(regex);

    return match ? match[1] : "";
}


function clean(text) {
    return text
        .replace(/<!\[CDATA\[/g, "")
        .replace(/\]\]>/g, "")
        .trim();
}


function stripHTML(text) {
    return text
        .replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .trim();
}
