export const metadata = {
  title: 'Bandwidth Game',
  description: 'Multiplayer Bandwidth guessing game'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
