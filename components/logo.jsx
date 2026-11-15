import Link from "next/link";

export default function Logo({ className = "" }) {
  return (
    <Link href="/" className={`vx-logo ${className}`} aria-label="BytecGlobal home">
      <span className="vx-logo-mark" aria-hidden="true"><img src="/bytecglobal-mark.png" alt="" width="36" height="36" /></span>
      <span className="vx-logo-word">Bytec<span className="vx-logo-accent">Global</span></span>
    </Link>
  );
}
