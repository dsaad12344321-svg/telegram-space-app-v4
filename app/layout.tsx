import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Telegram SDK */}
        <script src="https://telegram.org/js/telegram-web-app.js"></script>

        {/* Monetag SDK */}
        <script
          src="//libtl.com/sdk.js"
          data-zone="10552679"
          data-sdk="show_10552679"
        ></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
