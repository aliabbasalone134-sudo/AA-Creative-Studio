export default async function handler(request) {

    /* =====================================================
       CORS / OPTIONS
    ===================================================== */

    if (request.method === "OPTIONS") {
        return new Response(null, {
            status: 204,
            headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        });
    }


    /* =====================================================
       NEWS FEEDS
    ===================================================== */

    const feeds = [

        {
            name: "Pakistan",
            url: "https://news.google.com/rss/search?q=Pakistan&hl=en-PK&gl=PK&ceid=PK:en"
        },

        {
            name: "Lahore",
            url: "https://news.google.com/rss/search?q=Lahore&hl=en-PK&gl=PK&ceid=PK:en"
        },

        {
            name: "Punjab",
            url: "https://news.google.com/rss/search?q=Punjab+Pakistan&hl=en-PK&gl=PK&ceid=PK:en"
        },

        {
            name: "Islamabad",
            url: "https://news.google.com/rss/search?q=Islamabad&hl=en-PK&gl=PK&ceid=PK:en"
        },

        {
            name: "Karachi",
            url: "https://news.google.com/rss/search?q=Karachi&hl=en-PK&gl=PK&ceid=PK:en"
        }

    ];


    /* =====================================================
       FETCH NEWS
    ===================================================== */

    try {

        const results = [];


        for (const feed of feeds) {

            try {

                const response = await fetch(feed.url, {
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (compatible; AA-Creative-Studio/1.0)"
                    }
                });


                if (!response.ok) {

                    console.log(
                        "Feed failed:",
                        feed.name,
                        response.status
                    );

                    continue;
                }


                const xml = await response.text();


                const items =
                    xml.match(
                        /<item[\s\S]*?<\/item>/gi
                    ) || [];


                for (const item of items.slice(0, 10)) {

                    const title =
                        getTag(item, "title");

                    const link =
                        getTag(item, "link");

                    const date =
                        getTag(item, "pubDate");

                    const description =
                        getTag(item, "description");


                    if (!title || !link) {
                        continue;
                    }


                    results.push({

                        title:
                            decodeHTML(
                                clean(title)
                            ),

                        link:
                            decodeHTML(
                                clean(link)
                            ),

                        date:
                            clean(date),

                        description:
                            decodeHTML(
                                stripHTML(
                                    clean(description)
                                )
                            ),

                        source:
                            feed.name

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


        /* =================================================
           REMOVE DUPLICATES
        ================================================= */

        const unique = [];

        const seen = new Set();


        for (const item of results) {

            const key =
                item.title
                    .toLowerCase()
                    .trim();


            if (!seen.has(key)) {

                seen.add(key);

                unique.push(item);

            }

        }


        /* =================================================
           SORT BY DATE
        ================================================= */

        unique.sort((a, b) => {

            const dateA =
                new Date(a.date || 0).getTime();

            const dateB =
                new Date(b.date || 0).getTime();

            return dateB - dateA;

        });


        /* =================================================
           SUCCESS RESPONSE
        ================================================= */

        return new Response(

            JSON.stringify({

                success: true,

                updated:
                    new Date().toISOString(),

                total:
                    unique.length,

                news:
                    unique.slice(0, 50)

            }),

            {

                status: 200,

                headers: {

                    "Content-Type":
                        "application/json; charset=UTF-8",

                    "Access-Control-Allow-Origin":
                        "*",

                    "Access-Control-Allow-Methods":
                        "GET, OPTIONS",

                    "Cache-Control":
                        "public, max-age=300"

                }

            }

        );


    } catch (error) {


        /* =================================================
           SERVER ERROR
        ================================================= */

        console.error(
            "News function error:",
            error
        );


        return new Response(

            JSON.stringify({

                success: false,

                error:
                    "Unable to load news.",

                message:
                    error.message || "Unknown error"

            }),

            {

                status: 500,

                headers: {

                    "Content-Type":
                        "application/json; charset=UTF-8",

                    "Access-Control-Allow-Origin":
                        "*"

                }

            }

        );

    }

}


/* =========================================================
   GET XML TAG
========================================================= */

function getTag(xml, tag) {

    const regex =
        new RegExp(
            `<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`,
            "i"
        );


    const match =
        xml.match(regex);


    return match
        ? match[1]
        : "";

}


/* =========================================================
   CLEAN TEXT
========================================================= */

function clean(text) {

    return String(text || "")

        .replace(
            /<!\[CDATA\[/gi,
            ""
        )

        .replace(
            /\]\]>/gi,
            ""
        )

        .trim();

}


/* =========================================================
   REMOVE HTML
========================================================= */

function stripHTML(text) {

    return String(text || "")

        .replace(
            /<[^>]*>/g,
            " "
        )

        .replace(
            /\s+/g,
            " "
        )

        .trim();

}


/* =========================================================
   DECODE HTML ENTITIES
========================================================= */

function decodeHTML(text) {

    return String(text || "")

        .replace(
            /&amp;/g,
            "&"
        )

        .replace(
            /&quot;/g,
            '"'
        )

        .replace(
            /&#39;/g,
            "'"
        )

        .replace(
            /&apos;/g,
            "'"
        )

        .replace(
            /&lt;/g,
            "<"
        )

        .replace(
            /&gt;/g,
            ">"
        )

        .replace(
            /&#(\d+);/g,
            (match, dec) =>
                String.fromCharCode(dec)
        )

        .replace(
            /&#x([0-9a-f]+);/gi,
            (match, hex) =>
                String.fromCharCode(
                    parseInt(hex, 16)
                )
        )

        .trim();

}
