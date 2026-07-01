<?php
add_action('wp_head', function () {
    $widget_pages = [
        '/profilo-apprendimento/',
        '/profilo-apprendimento/*',
        '/mio-account/*',
    ];

    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

    $show_widget = false;

    foreach ($widget_pages as $pattern) {
        if (str_ends_with($pattern, '/*')) {
            $base = rtrim($pattern, '/*');

            if (str_starts_with($path, $base)) {
                $show_widget = true;
                break;
            }
        } elseif ($path === $pattern) {
            $show_widget = true;
            break;
        }
    }

    if (! $show_widget) {
        return;
    }

    echo '<!-- REFREF ACTIVE path=' . esc_html($path) . " -->\n";
    echo '<script async src="https://staging-refref.strtgy.design/attribution.v1.js"></script>' . "\n";

    echo '<script>
    window.RefRef = window.RefRef || [];

    function initRefRefWidget() {
      if (window.__refrefWidgetInitialized) return;
      window.__refrefWidgetInitialized = true;

      window.RefRef.push(["init", {
        productId: "prd_h891ovo4s934matqd8a72vo7",
        apiUrl: "https://staging-refref.strtgy.design"
      }]);
    }
    </script>' . "\n";

    echo '<script async src="https://staging-refref.strtgy.design/widget.v1.js" onload="initRefRefWidget()"></script>' . "\n";

    echo '<script>
    (function () {
      function getSiteFont() {
        const bodyFont = document.body ? getComputedStyle(document.body).fontFamily : "";
        const htmlFont = getComputedStyle(document.documentElement).fontFamily;
        return (bodyFont && bodyFont !== "inherit" ? bodyFont : htmlFont) || "system-ui, sans-serif";
      }

      function applyFont() {
        const host = Array.from(document.querySelectorAll("div")).find((el) =>
          el.shadowRoot && el.shadowRoot.querySelector("#widget-root")
        );

        if (!host || !host.shadowRoot) return false;

        const font = getSiteFont();

        let style = host.shadowRoot.getElementById("refref-font-override");
        if (!style) {
          style = document.createElement("style");
          style.id = "refref-font-override";
          host.shadowRoot.appendChild(style);
        }

        style.textContent =
          ":host, #widget-root, #widget-root * { font-family: " + font + " !important; }";

        return true;
      }

      function start() {
        if (applyFont()) return;

        const observer = new MutationObserver(() => {
          if (applyFont()) observer.disconnect();
        });

        observer.observe(document.documentElement, {
          childList: true,
          subtree: true
        });

        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(applyFont);
        }

        setTimeout(applyFont, 1500);
      }

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", start, { once: true });
      } else {
        start();
      }
    })();
    </script>' . "\n";
}, 99);
