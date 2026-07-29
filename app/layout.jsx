import "./globals.css";

export const metadata = {
  title: "Stud Haus | Men's Diamond Wedding Bands",
  description:
    "Made-to-order men's diamond wedding bands with hidden diamond detail, built for presence, restraint and permanence.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
