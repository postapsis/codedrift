/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import type { JSX } from "react";
import { Link } from "@tanstack/react-router";

const Header = (): JSX.Element => {
  return (
    <header className="px-2">
      <Link to={"/"}>
        <img src="/codedrift_logo_light.svg" className="h-3.5" alt="Codedrift Logo" />
      </Link>
    </header>
  );
};

export default Header;
