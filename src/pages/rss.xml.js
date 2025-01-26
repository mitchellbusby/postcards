import rss from "@astrojs/rss";
import { getCollection } from "astro:content";

import { format } from "date-fns"; // Optional for ease

export function convertUnixToRssDate(unixTimestamp) {
  const date = new Date(unixTimestamp * 1000); // Convert from seconds to milliseconds
  return date.toUTCString(); // Format as RFC 2822
}

export async function GET(context) {
  const postcards = await getCollection("postcards");
  return rss({
    // `<title>` field in output xml
    title: "Mitchell Busby's Postcards from Friends",
    // `<description>` field in output xml
    description: "A collection of the postcards I receive from my friends",
    // Pull in your project "site" from the endpoint context
    // https://docs.astro.build/en/reference/api-reference/#site
    site: context.site,
    // Array of `<item>`s in output xml
    // See "Generating items" section for examples using content collections and glob imports
    items: postcards.map((postcard) => ({
      title: `${postcard.data.title}, ${postcard.data.location}, ${postcard.data.dateReceived}`,
      pubDate: convertUnixToRssDate(postcard.data.publishDate),
      link: `/postcards/${postcard.id}`,
    })),
    // (optional) inject custom xml
    customData: `<language>en-us</language>`,
  });
}
