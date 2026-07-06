/*
 * Author: Jamius Siam
 * Since: 30/05/2026
 */
import type { JSX } from "react";
import { Link } from "@tanstack/react-router";
import SettingsDialog from "@/components/settings/settings-dialog.tsx";

const Header = (): JSX.Element => {
  return (
    <header className="flex items-center justify-between px-3.5 2k:px-2">
      <Link to={"/"}>
        <img src="/codedrift_logo_light.svg" className="h-3.5" alt="Codedrift Logo" />
      </Link>
      <SettingsDialog />
    </header>
  );
};

export default Header;
