import Link from "next/link";
import { brand } from "@config/brand";

export function Footer() {
  return (
    <footer className="relative z-10 bg-base py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap justify-center gap-6">
          {brand.footer.links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-text-dim transition hover:text-accent"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-text-dim">
          © {new Date().getFullYear()} {brand.appName}. {brand.footer.copyright}
        </p>
      </div>
    </footer>
  );
}
