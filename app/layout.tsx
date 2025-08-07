import '../styles/global.css'
export const metadata = {
  title: 'Universal Slider',
  description: 'Made with ❤️ by Duy Nguyen',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
