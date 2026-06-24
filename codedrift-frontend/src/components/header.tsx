/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import type { JSX } from "react";
import { Link } from "@tanstack/react-router";

const Header = (): JSX.Element => {
  return (
    <header className="px-4">
      <Link to={"/"}>
        <img src="/codedrift_logo_light.svg" className="h-4" alt="Codedrift Logo" />
      </Link>
    </header>
  );
};

export default Header;
