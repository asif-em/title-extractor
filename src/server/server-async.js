const http = require("http");
const https = require("https");
const url = require("url");
const async = require("async");

// Function to normalize URL by extracting hostname and path and creating a clickable URL
const normalizeUrl = (siteUrl) => {
  try {
    const parsedUrl = new URL(siteUrl);
    // Ensure URL includes the protocol to make it clickable
    return `${parsedUrl.protocol}//${parsedUrl.hostname}${parsedUrl.pathname}`;
  } catch (e) {
    // If URL parsing fails, return a URL with http protocol
    return `http://${siteUrl}`;
  }
};

// Function to fetch and extract the title from a URL
const fetchTitle = (siteUrl, callback) => {
  if (!/^https?:\/\//i.test(siteUrl)) {
    siteUrl = `http://${siteUrl}`;
  }

  const parsedUrl = new URL(siteUrl);
  const protocol = parsedUrl.protocol === "https:" ? https : http;

  const requestOptions = {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3",
    },
  };

  const request = protocol.get(siteUrl, requestOptions, (response) => {
    if (
      response.statusCode >= 300 &&
      response.statusCode < 400 &&
      response.headers.location
    ) {
      fetchTitle(new URL(response.headers.location, siteUrl).href, callback);
      return;
    }

    let data = "";

    response.on("data", (chunk) => {
      data += chunk;
    });

    response.on("end", () => {
      const titleMatch = data.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : "No Title Found";
      const normalizedUrl = normalizeUrl(siteUrl);
      callback(
        null,
        `<li><a href="${normalizedUrl}">${normalizeUrl(
          siteUrl
        )}</a> - "${title}"</li>`
      );
    });
  });

  request.on("error", () => {
    const normalizedUrl = normalizeUrl(siteUrl);
    callback(
      null,
      `<li><a href="${normalizedUrl}">${normalizeUrl(
        siteUrl
      )}</a> - NO RESPONSE</li>`
    );
  });
};

// Create an HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (req.method === "GET" && parsedUrl.pathname === "/I/want/title/") {
    const addresses = parsedUrl.query.address;

    if (!addresses) {
      res.writeHead(400, { "Content-Type": "text/html" });
      res.end("<html><body><h1>400 Bad Request</h1></body></html>");
      return;
    }

    const urls = Array.isArray(addresses) ? addresses : [addresses];

    // Use async.map to process URLs in parallel and in the provided order
    async.map(
      urls,
      (siteUrl, callback) => fetchTitle(siteUrl, callback),
      (err, results) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "text/html" });
          res.end(
            "<html><body><h1>500 Internal Server Error</h1></body></html>"
          );
          return;
        }

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
          <html>
            <head></head>
            <body>
              <h1>Following are the titles of given websites:</h1>
              <ul>
                ${results.join("\n")}
              </ul>
            </body>
          </html>
        `);
      }
    );
  } else {
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end("<html><body><h1>404 Not Found</h1></body></html>");
  }
});

// Start the server
server.listen(3000, () => {
  console.log("Server running at http://localhost:3000/");
});
