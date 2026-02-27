import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full text-center py-4 mt-8">
      <span>{new Date().getFullYear()} &copy; Made by </span>
      <a href="https://acwd.me" target="_blank" rel="noopener noreferrer" className=" underline">Alex Carlson</a>
      <span> &middot; </span>
      <Link href="/privacy-policy" className="underline">Privacy Policy</Link>
    </footer>
  );
}
